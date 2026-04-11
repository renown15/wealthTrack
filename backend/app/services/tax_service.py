"""
Tax service — eligible account discovery and tax return orchestration.
"""
from datetime import date, datetime, time
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload

from app.models.account import Account
from app.models.account_event import AccountEvent
from app.models.reference_data import ReferenceData
from app.repositories.account_attribute_repository import AccountAttributeRepository
from app.repositories.event_group_repository import EventGroupRepository
from app.repositories.tax_document_repository import TaxDocumentRepository
from app.repositories.tax_return_repository import TaxReturnRepository

_ISA_TYPES: frozenset[str] = frozenset({"Cash ISA", "Fixed Rate ISA", "Stocks ISA"})
_SHARES_TYPE = "Shares"


def _parse_date(value: str | None) -> date | None:
    """Parse an ISO-format date string stored in an account attribute."""
    if not value:
        return None
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        return None


def _savings_eligible(
    account_type: str,
    attrs: dict[str, str],
    period_start: date,
    period_end: date,
) -> bool:
    """Return True if account is an interest-bearing non-ISA open during the period."""
    if account_type in _ISA_TYPES:
        return False
    if not attrs.get("Interest Rate"):
        return False
    opened = _parse_date(attrs.get("Account Opened Date"))
    closed = _parse_date(attrs.get("Account Closed Date"))
    if opened and opened > period_end:
        return False
    if closed and closed < period_start:
        return False
    return True


def _shares_sold_eligible(
    account_type: str,
    attrs: dict[str, str],
    period_start: date,
    period_end: date,
    account_id: int | None = None,
    accounts_with_sales: set[int] | None = None,
) -> bool:
    """Return True if this is a Shares account with a Share Sale event in the period."""
    if account_type != _SHARES_TYPE:
        return False
    if not account_id or not accounts_with_sales:
        return False
    return account_id in accounts_with_sales


async def _fetch_accounts_with_attrs(
    session: AsyncSession,
    user_id: int,
) -> list[dict[str, Any]]:
    """Batch-fetch all user accounts with their type labels, status and attributes."""
    status_rd = aliased(ReferenceData)
    stmt = (
        select(
            Account,
            ReferenceData.reference_value.label("account_type"),
            status_rd.reference_value.label("account_status"),
        )
        .join(ReferenceData, ReferenceData.id == Account.type_id)
        .outerjoin(status_rd, status_rd.id == Account.status_id)
        .where(Account.user_id == user_id)
        .options(selectinload(Account.institution))
    )
    result = await session.execute(stmt)
    rows = result.all()
    if not rows:
        return []

    account_ids = [row.Account.id for row in rows]
    attr_repo = AccountAttributeRepository(session)
    all_attrs = await attr_repo.get_all_attributes_for_accounts(account_ids, user_id)

    return [
        {
            "account": row.Account,
            "account_type": row.account_type,
            "account_status": row.account_status,
            "attrs": all_attrs.get(row.Account.id, {}),
        }
        for row in rows
    ]


def _filter_eligible(
    rows: list[dict[str, Any]],
    period_start: date,
    period_end: date,
    accounts_with_sales: set[int] | None = None,
) -> list[dict[str, Any]]:
    """Filter rows to those eligible for the period."""
    if accounts_with_sales is None:
        accounts_with_sales = set()
    eligible = []
    for row in rows:
        attrs: dict[str, str] = row["attrs"]
        account_type: str = row["account_type"]
        account_id: int = row["account"].id
        if _savings_eligible(account_type, attrs, period_start, period_end):
            reason = "interest_bearing"
        elif _shares_sold_eligible(
            account_type, attrs, period_start, period_end,
            account_id, accounts_with_sales
        ):
            reason = "sold_in_period"
        else:
            continue
        eligible.append({
            "account": row["account"],
            "account_type": account_type,
            "account_status": row.get("account_status"),
            "interest_rate": attrs.get("Interest Rate"),
            "eligibility_reason": reason,
            "attrs": attrs,
        })
    return eligible


async def get_eligible_with_returns(
    session: AsyncSession,
    user_id: int,
    tax_period_id: int,
    period_start: date,
    period_end: date,
) -> list[dict[str, Any]]:
    """Return eligible accounts enriched with TaxReturn and document data."""
    rows = await _fetch_accounts_with_attrs(session, user_id)

    # Fetch Share Sale events in the period to determine which Shares accounts are relevant
    period_start_dt = datetime.combine(period_start, time.min)
    period_end_dt = datetime.combine(period_end, time.max)

    share_sale_type = await session.execute(
        select(ReferenceData.id)
        .where(ReferenceData.class_key == "account_event_type")
        .where(ReferenceData.reference_value == "Share Sale")
    )
    share_sale_type_id = share_sale_type.scalar()
    accounts_with_sales: set[int] = set()
    if share_sale_type_id:
        sales_result = await session.execute(
            select(AccountEvent.account_id)
            .where(AccountEvent.type_id == share_sale_type_id)
            .where(AccountEvent.user_id == user_id)
            .where(AccountEvent.created_at >= period_start_dt)
            .where(AccountEvent.created_at <= period_end_dt)
            .distinct()
        )
        accounts_with_sales = set(row[0] for row in sales_result.all())

    eligible = _filter_eligible(rows, period_start, period_end, accounts_with_sales)

    # Batch-fetch event counts for all eligible accounts
    eligible_ids = [item["account"].id for item in eligible]
    event_counts: dict[int, int] = {}
    if eligible_ids:
        count_result = await session.execute(
            select(AccountEvent.account_id, func.count(AccountEvent.id).label("cnt"))  # pylint: disable=not-callable
            .where(AccountEvent.account_id.in_(eligible_ids))
            .group_by(AccountEvent.account_id)
        )
        event_counts = {row.account_id: row.cnt for row in count_result.all()}

    return_repo = TaxReturnRepository(session)
    doc_repo = TaxDocumentRepository(session)
    group_repo = EventGroupRepository(session)

    enriched: list[dict[str, Any]] = []
    for item in eligible:
        account: Account = item["account"]
        account_type: str = item["account_type"]

        # For Shares accounts, load capital gain and tax from Share Sale groups
        capital_gain = None
        tax_taken_off = None

        if account_type == _SHARES_TYPE:
            groups = await group_repo.get_groups_for_account(
                account.id, user_id, "Share Sale"
            )
            # Sum capital_gain and cgt from all Share Sale groups
            total_capital_gain = 0.0
            total_tax = 0.0
            for group in groups:
                for attr in group.get("attributes", []):
                    # Match capital_gain attribute (case-insensitive, handle variations)
                    attr_type_normalized = attr["attribute_type"].lower().replace(" ", "_")
                    if "capital_gain" in attr_type_normalized:
                        try:
                            total_capital_gain += float(attr["value"])
                        except (ValueError, TypeError):
                            pass
                # Look for CGT event on the tax liability account
                for event in group.get("events", []):
                    if event["event_type"] == "Capital Gains Tax":
                        try:
                            total_tax += float(event["value"])
                        except (ValueError, TypeError):
                            pass
            if total_capital_gain > 0:
                capital_gain = total_capital_gain
            if total_tax > 0:
                tax_taken_off = total_tax

        # Get or create tax return with loaded values
        tax_return = await return_repo.upsert(
            user_id, account.id, tax_period_id,
            income=None,
            capital_gain=capital_gain,
            tax_taken_off=tax_taken_off,
        )

        documents = []
        if tax_return:
            documents = await doc_repo.list_for_return(tax_return.id, user_id)

        enriched.append({
            **item,
            "tax_return": tax_return,
            "documents": documents,
            "event_count": event_counts.get(account.id, 0),
        })

    return enriched
