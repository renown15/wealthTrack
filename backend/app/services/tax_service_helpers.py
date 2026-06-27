"""
Helper functions for tax service — eligibility checks and DB queries.
"""
from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload

from app.models.account import Account
from app.models.account_event import AccountEvent
from app.models.account_event_attribute_group_member import AccountEventAttributeGroupMember
from app.models.reference_data import ReferenceData
from app.repositories.account_attribute_repository import AccountAttributeRepository

ISA_TYPES: frozenset[str] = frozenset({"Cash ISA", "Fixed Rate ISA", "Stocks ISA"})
PENSION_TYPES: frozenset[str] = frozenset({"Deferred DC Pension", "Deferred DB Pension", "SIPP"})
TAX_FREE_TYPES: frozenset[str] = ISA_TYPES | PENSION_TYPES
_ISA_TYPES = ISA_TYPES
_SHARES_TYPE = "Shares"


def parse_date(value: str | None) -> date | None:
    """Parse a date string stored in an account attribute (ISO YYYY-MM-DD or DD/MM/YYYY)."""
    if not value:
        return None
    try:
        if '/' in value:
            parts = value.split('/')
            if len(parts) == 3:
                return date(int(parts[2]), int(parts[1]), int(parts[0]))
        return date.fromisoformat(value[:10])
    except (ValueError, IndexError):
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


async def get_dividend_totals(
    session: AsyncSession,
    user_id: int,
    account_ids: list[int],
    period_start: date,
    period_end: date,
) -> dict[int, float]:
    """Sum Dividend amounts whose payment date falls in the period.

    Finds 'Dividend Payment Date' events with value in [period_start, period_end],
    walks the group to get the partner 'Dividend' amount event, and sums per account.
    """
    if not account_ids:
        return {}
    ref = await session.execute(
        select(ReferenceData.id, ReferenceData.reference_value).where(
            ReferenceData.class_key == "account_event_type",
            ReferenceData.reference_value.in_(["Dividend", "Dividend Payment Date"]),
        )
    )
    type_ids = {row.reference_value: row.id for row in ref.all()}
    dividend_type_id = type_ids.get("Dividend")
    date_type_id = type_ids.get("Dividend Payment Date")
    if not dividend_type_id or not date_type_id:
        return {}

    date_ev = AccountEvent.__table__.alias("date_ev")
    date_mbr = AccountEventAttributeGroupMember.__table__.alias("date_mbr")
    div_mbr = AccountEventAttributeGroupMember.__table__.alias("div_mbr")
    div_ev = AccountEvent.__table__.alias("div_ev")

    stmt = (
        select(div_ev.c.accountid, div_ev.c.value)
        .select_from(date_ev)
        .join(date_mbr, date_mbr.c.account_event_id == date_ev.c.id)
        .join(div_mbr, div_mbr.c.groupid == date_mbr.c.groupid)
        .join(div_ev, div_ev.c.id == div_mbr.c.account_event_id)
        .where(date_ev.c.accountid.in_(account_ids))
        .where(date_ev.c.userid == user_id)
        .where(date_ev.c.typeid == date_type_id)
        .where(date_ev.c.value >= period_start.isoformat())
        .where(date_ev.c.value <= period_end.isoformat())
        .where(div_ev.c.typeid == dividend_type_id)
        .where(div_mbr.c.account_event_id != date_ev.c.id)
    )
    rows = await session.execute(stmt)
    totals: dict[int, float] = {}
    for row in rows.all():
        try:
            acct_id = row[0]
            totals[acct_id] = totals.get(acct_id, 0.0) + float(row[1])
        except (ValueError, TypeError):
            pass
    return totals


def filter_eligible(
    rows: list[dict[str, Any]],
    period_start: date,
    period_end: date,
    accounts_with_sales: set[int] | None = None,
    accounts_with_dividends: set[int] | None = None,
) -> list[dict[str, Any]]:
    """Filter rows to those eligible for the period."""
    if accounts_with_sales is None:
        accounts_with_sales = set()
    if accounts_with_dividends is None:
        accounts_with_dividends = set()
    eligible = []
    for row in rows:
        attrs: dict[str, str] = row["attrs"]
        account_type: str = row["account_type"]
        account_id: int = row["account"].id
        if savings_eligible(account_type, attrs, period_start, period_end):
            reason = "interest_bearing"
        elif shares_sold_eligible(account_type, account_id, accounts_with_sales):
            reason = "sold_in_period"
        elif account_type == _SHARES_TYPE and account_id in accounts_with_dividends:
            reason = "dividend_income"
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
