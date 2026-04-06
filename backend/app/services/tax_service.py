"""
Tax service — eligible account discovery and tax return orchestration.
"""
from datetime import date
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload

from app.models.account import Account
from app.models.account_event import AccountEvent
from app.models.reference_data import ReferenceData
from app.repositories.account_attribute_repository import AccountAttributeRepository
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
) -> bool:
    """Return True if this is a Shares account closed (sold) within the period."""
    if account_type != _SHARES_TYPE:
        return False
    closed = _parse_date(attrs.get("Account Closed Date"))
    if not closed:
        return False
    return period_start <= closed <= period_end


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
) -> list[dict[str, Any]]:
    """Filter rows to those eligible for the period."""
    eligible = []
    for row in rows:
        attrs: dict[str, str] = row["attrs"]
        account_type: str = row["account_type"]
        if _savings_eligible(account_type, attrs, period_start, period_end):
            reason = "interest_bearing"
        elif _shares_sold_eligible(account_type, attrs, period_start, period_end):
            reason = "sold_in_period"
        else:
            continue
        eligible.append({
            "account": row["account"],
            "account_type": account_type,
            "interest_rate": attrs.get("Interest Rate"),
            "eligibility_reason": reason,
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
    eligible = _filter_eligible(rows, period_start, period_end)

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

    enriched: list[dict[str, Any]] = []
    for item in eligible:
        account: Account = item["account"]
        tax_return = await return_repo.get_for_account_period(
            user_id, account.id, tax_period_id
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
