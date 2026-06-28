"""
Tax service — eligible account discovery and tax return orchestration.
"""
from datetime import date as date_type
from datetime import datetime, time
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.account_event import AccountEvent
from app.repositories.account_group_repository import AccountGroupRepository
from app.repositories.event_group_repository import EventGroupRepository
from app.repositories.tax_document_repository import TaxDocumentRepository
from app.repositories.tax_return_repository import TaxReturnRepository
from app.services.tax_liability_helpers import (
    get_first_balance_dates,
    get_share_sales_in_period,
    get_tax_liability_rows,
)
from app.services.tax_scope_helpers import OUT_OF_SCOPE, get_scope_maps
from app.services.tax_service_helpers import (
    DIVIDEND_TAX_RATE,
    TAX_FREE_TYPES,
    fetch_accounts_with_attrs,
    filter_eligible,
    get_dividend_totals,
    group_sale_date,
    optional_sum,
)

_SHARES_TYPE = "Shares"


def _share_sale_gain_tax(
    groups: list[dict[str, Any]],
    period_start: date_type | None,
    period_end: date_type | None,
) -> tuple[float | None, float | None]:
    """Sum capital gain and CGT from share-sale groups recorded within the period."""
    total_gain = total_tax = 0.0
    for group in groups:
        sale_date = group_sale_date(group)
        if period_start and period_end and sale_date is not None:
            in_period = period_start <= sale_date <= period_end
            if not in_period:
                continue  # sale recorded outside this tax year — excluded
        for attr in group.get("attributes", []):
            if "capital_gain" in attr["attribute_type"].lower().replace(" ", "_"):
                try:
                    total_gain += float(attr["value"])
                except (ValueError, TypeError):
                    pass
        for event in group.get("events", []):
            if event["event_type"] == "Capital Gains Tax":
                try:
                    total_tax += float(event["value"])
                except (ValueError, TypeError):
                    pass
    return (total_gain if total_gain > 0 else None, total_tax if total_tax > 0 else None)


async def _enrich_items(
    session: AsyncSession,
    user_id: int,
    tax_period_id: int,
    items: list[dict[str, Any]],
    event_counts: dict[int, int],
    first_balance_dates: dict[int, Any] | None = None,
    dividend_totals: dict[int, float] | None = None,
    scope_by_id: dict[int, str] | None = None,
    period_start: date_type | None = None,
    period_end: date_type | None = None,
) -> list[dict[str, Any]]:
    return_repo = TaxReturnRepository(session)
    doc_repo = TaxDocumentRepository(session)
    group_repo = EventGroupRepository(session)
    enriched: list[dict[str, Any]] = []

    for item in items:
        account: Account = item["account"]
        is_shares = item["account_type"] == _SHARES_TYPE
        income = (dividend_totals or {}).get(account.id) if is_shares else None
        capital_gain = None
        tax_due = None

        if is_shares:
            groups = await group_repo.get_groups_for_account(account.id, user_id, "Share Sale")
            capital_gain, cgt = _share_sale_gain_tax(groups, period_start, period_end)
            dividend_tax = round(income * DIVIDEND_TAX_RATE / 100, 2) if income else None
            tax_due = optional_sum(cgt, dividend_tax)

        if item["account_type"] == "Tax Liability":
            # Pot drives net wealth via its negated balance; tax shown per share account.
            tax_return = await return_repo.upsert(
                user_id, account.id, tax_period_id, None, None, None, None)
        elif is_shares:
            tax_return = await return_repo.upsert(
                user_id, account.id, tax_period_id, income, capital_gain, None, tax_due)
        else:
            tax_return = await return_repo.get_or_create(
                user_id, account.id, tax_period_id,
                income=income, capital_gain=capital_gain, tax_taken_off=None)
        documents = await doc_repo.list_for_return(tax_return.id, user_id) if tax_return else []
        status_id = getattr(tax_return, "scope_status_id", None)
        scope = (scope_by_id or {}).get(status_id) if status_id is not None else None
        enriched.append(
            {
                **item,
                "tax_return": tax_return,
                "documents": documents,
                "scope": scope,
                "event_count": event_counts.get(account.id, 0),
                "first_balance_date": (first_balance_dates or {}).get(account.id),
            }
        )

    return enriched


async def get_eligible_with_returns(
    session: AsyncSession,
    user_id: int,
    tax_period_id: int,
    period_start: date_type,
    period_end: date_type,
    group_id: int | None = None,
    period_name: str = "",
) -> dict[str, list[dict[str, Any]]]:
    """Return accounts split into in_scope (group members) and eligible (rules-matched)."""
    rows = await fetch_accounts_with_attrs(session, user_id)
    period_start_dt = datetime.combine(period_start, time.min)
    period_end_dt = datetime.combine(period_end, time.max)

    accounts_with_sales = await get_share_sales_in_period(
        session, user_id, period_start_dt, period_end_dt
    )
    shares_ids = [r["account"].id for r in rows if r["account_type"] == "Shares"]
    dividend_totals = await get_dividend_totals(
        session, user_id, shares_ids, period_start, period_end
    )
    eligible_rows = filter_eligible(
        rows, period_start, period_end, accounts_with_sales, set(dividend_totals.keys())
    )

    group_member_ids: set[int] = set()
    if group_id:
        group_repo = AccountGroupRepository(session)
        member_ids = await group_repo.get_group_members(group_id, user_id)
        group_member_ids = set(member_ids)

    rows_by_id = {r["account"].id: r for r in rows}

    in_scope_rows = []
    for account_id in group_member_ids:
        row = rows_by_id.get(account_id)
        if row:
            in_scope_rows.append({**row, "eligibility_reason": "in_scope"})

    eligible_only_rows = [r for r in eligible_rows if r["account"].id not in group_member_ids]

    eligible_and_scope_ids = {r["account"].id for r in eligible_rows} | group_member_ids
    excluded_rows = [
        r for r in rows
        if r["account"].id not in eligible_and_scope_ids
        and r["account_type"] != "Tax Liability"
    ]
    tax_free_rows = [r for r in excluded_rows if r["account_type"] in TAX_FREE_TYPES]
    not_in_scope_rows = [r for r in excluded_rows if r["account_type"] not in TAX_FREE_TYPES]

    if period_name:
        tax_in_scope, tax_eligible = await get_tax_liability_rows(
            session, user_id, rows, period_name
        )
        in_scope_rows.extend(tax_in_scope)
        eligible_only_rows.extend(tax_eligible)

    all_rows = in_scope_rows + eligible_only_rows + tax_free_rows + not_in_scope_rows
    all_ids = list({r["account"].id for r in all_rows})
    event_counts: dict[int, int] = {}
    first_balance_dates: dict[int, Any] = {}
    if all_ids:
        count_result = await session.execute(
            select(AccountEvent.account_id, func.count(AccountEvent.id).label("cnt"))  # pylint: disable=not-callable
            .where(AccountEvent.account_id.in_(all_ids))
            .group_by(AccountEvent.account_id)
        )
        event_counts = {row.account_id: row.cnt for row in count_result.all()}
        first_balance_dates = await get_first_balance_dates(
            session, user_id, all_ids, period_start_dt, period_end_dt
        )

    scope_by_id, _ = await get_scope_maps(session)
    in_scope = await _enrich_items(
        session, user_id, tax_period_id, in_scope_rows,
        event_counts, first_balance_dates, dividend_totals, scope_by_id,
        period_start, period_end,
    )
    eligible = await _enrich_items(
        session, user_id, tax_period_id, eligible_only_rows,
        event_counts, first_balance_dates, dividend_totals, scope_by_id,
        period_start, period_end,
    )
    def _bare_items(rows_list: list[dict[str, Any]], reason: str) -> list[dict[str, Any]]:
        return [
            {**r, "eligibility_reason": reason, "scope": None,
             "event_count": event_counts.get(r["account"].id, 0),
             "first_balance_date": None, "tax_return": None, "documents": []}
            for r in rows_list
        ]

    # Eligible accounts marked out of scope drop to not-in-scope (keeping tax_return).
    overridden = [e for e in eligible if e.get("scope") == OUT_OF_SCOPE]
    eligible = [e for e in eligible if e.get("scope") != OUT_OF_SCOPE]
    for item in overridden:
        item["eligibility_reason"] = "not_in_scope"

    tax_free = _bare_items(tax_free_rows, "tax_free")
    not_in_scope = overridden + _bare_items(not_in_scope_rows, "not_in_scope")

    return {
        "in_scope": in_scope, "eligible": eligible,
        "tax_free": tax_free, "not_in_scope": not_in_scope,
    }
