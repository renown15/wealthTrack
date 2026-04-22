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
from app.models.reference_data import ReferenceData
from app.repositories.account_group_repository import AccountGroupRepository
from app.repositories.event_group_repository import EventGroupRepository
from app.repositories.tax_document_repository import TaxDocumentRepository
from app.repositories.tax_return_repository import TaxReturnRepository
from app.services.tax_service_helpers import fetch_accounts_with_attrs, filter_eligible

_SHARES_TYPE = "Shares"


async def _get_share_sales(
    session: AsyncSession, user_id: int, period_start_dt: datetime, period_end_dt: datetime
) -> set[int]:
    share_sale_type = await session.execute(
        select(ReferenceData.id)
        .where(ReferenceData.class_key == "account_event_type")
        .where(ReferenceData.reference_value == "Share Sale")
    )
    share_sale_type_id = share_sale_type.scalar()
    if not share_sale_type_id:
        return set()
    sales_result = await session.execute(
        select(AccountEvent.account_id)
        .where(AccountEvent.type_id == share_sale_type_id)
        .where(AccountEvent.user_id == user_id)
        .where(AccountEvent.created_at >= period_start_dt)
        .where(AccountEvent.created_at <= period_end_dt)
        .distinct()
    )
    return set(row[0] for row in sales_result.all())


async def _enrich_items(
    session: AsyncSession,
    user_id: int,
    tax_period_id: int,
    items: list[dict[str, Any]],
    event_counts: dict[int, int],
) -> list[dict[str, Any]]:
    return_repo = TaxReturnRepository(session)
    doc_repo = TaxDocumentRepository(session)
    group_repo = EventGroupRepository(session)
    enriched: list[dict[str, Any]] = []

    for item in items:
        account: Account = item["account"]
        capital_gain = None
        tax_taken_off = None

        if item["account_type"] == _SHARES_TYPE:
            groups = await group_repo.get_groups_for_account(account.id, user_id, "Share Sale")
            total_gain, total_tax = 0.0, 0.0
            for group in groups:
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
            if total_gain > 0:
                capital_gain = total_gain
            if total_tax > 0:
                tax_taken_off = total_tax

        tax_return = await return_repo.get_or_create(
            user_id,
            account.id,
            tax_period_id,
            income=None,
            capital_gain=capital_gain,
            tax_taken_off=tax_taken_off,
        )
        documents = await doc_repo.list_for_return(tax_return.id, user_id) if tax_return else []
        enriched.append(
            {
                **item,
                "tax_return": tax_return,
                "documents": documents,
                "event_count": event_counts.get(account.id, 0),
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
) -> dict[str, list[dict[str, Any]]]:
    """Return accounts split into in_scope (group members) and eligible (rules-matched)."""
    rows = await fetch_accounts_with_attrs(session, user_id)
    period_start_dt = datetime.combine(period_start, time.min)
    period_end_dt = datetime.combine(period_end, time.max)

    accounts_with_sales = await _get_share_sales(session, user_id, period_start_dt, period_end_dt)
    eligible_rows = filter_eligible(rows, period_start, period_end, accounts_with_sales)

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

    all_ids = list({r["account"].id for r in in_scope_rows + eligible_only_rows})
    event_counts: dict[int, int] = {}
    if all_ids:
        count_result = await session.execute(
            select(AccountEvent.account_id, func.count(AccountEvent.id).label("cnt"))  # pylint: disable=not-callable
            .where(AccountEvent.account_id.in_(all_ids))
            .group_by(AccountEvent.account_id)
        )
        event_counts = {row.account_id: row.cnt for row in count_result.all()}

    in_scope = await _enrich_items(session, user_id, tax_period_id, in_scope_rows, event_counts)
    eligible = await _enrich_items(
        session, user_id, tax_period_id, eligible_only_rows, event_counts
    )

    return {"in_scope": in_scope, "eligible": eligible}
