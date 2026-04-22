"""
Helper functions for tax service — eligibility checks and DB queries.
"""
from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload

from app.models.account import Account
from app.models.reference_data import ReferenceData
from app.repositories.account_attribute_repository import AccountAttributeRepository

_ISA_TYPES: frozenset[str] = frozenset({"Cash ISA", "Fixed Rate ISA", "Stocks ISA"})
_SHARES_TYPE = "Shares"


def parse_date(value: str | None) -> date | None:
    """Parse an ISO-format date string stored in an account attribute."""
    if not value:
        return None
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        return None


def savings_eligible(
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
    opened = parse_date(attrs.get("Account Opened Date"))
    closed = parse_date(attrs.get("Account Closed Date"))
    if opened and opened > period_end:
        return False
    if closed and closed < period_start:
        return False
    return True


def shares_sold_eligible(
    account_type: str,
    account_id: int | None,
    accounts_with_sales: set[int] | None,
) -> bool:
    """Return True if this is a Shares account with a Share Sale event in the period."""
    if account_type != _SHARES_TYPE:
        return False
    if not account_id or not accounts_with_sales:
        return False
    return account_id in accounts_with_sales


async def fetch_accounts_with_attrs(
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


def filter_eligible(
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
        if savings_eligible(account_type, attrs, period_start, period_end):
            reason = "interest_bearing"
        elif shares_sold_eligible(account_type, account_id, accounts_with_sales):
            reason = "sold_in_period"
        else:
            continue
        eligible.append(
            {
                "account": row["account"],
                "account_type": account_type,
                "account_status": row.get("account_status"),
                "interest_rate": attrs.get("Interest Rate"),
                "eligibility_reason": reason,
                "attrs": attrs,
            }
        )
    return eligible
