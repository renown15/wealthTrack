"""Helpers for including Tax Liability accounts in the Tax Hub."""
from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account_event import AccountEvent
from app.models.reference_data import ReferenceData
from app.repositories.account_event_repository import AccountEventRepository


async def get_share_sales_in_period(
    session: AsyncSession, user_id: int, period_start_dt: datetime, period_end_dt: datetime
) -> set[int]:
    """Return account IDs that have a Share Sale event in the given period."""
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


async def get_first_balance_dates(
    session: AsyncSession,
    user_id: int,
    account_ids: list[int],
    period_start_dt: datetime,
    period_end_dt: datetime,
) -> dict[int, Any]:
    """Return the first Balance Update date per account within the period."""
    balance_type_id = (
        await session.execute(
            select(ReferenceData.id)
            .where(ReferenceData.class_key == "account_event_type")
            .where(ReferenceData.reference_value == "Balance Update")
        )
    ).scalar()
    if not balance_type_id or not account_ids:
        return {}
    rows = await session.execute(
        select(AccountEvent.account_id, func.min(AccountEvent.created_at).label("first_dt"))
        .where(AccountEvent.account_id.in_(account_ids))
        .where(AccountEvent.user_id == user_id)
        .where(AccountEvent.type_id == balance_type_id)
        .where(AccountEvent.created_at >= period_start_dt)
        .where(AccountEvent.created_at <= period_end_dt)
        .group_by(AccountEvent.account_id)
    )
    return {row.account_id: row.first_dt.date() for row in rows.all()}


async def get_tax_liability_rows(
    session: AsyncSession,
    user_id: int,
    rows: list[dict[str, Any]],
    period_name: str,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Return (in_scope_rows, eligible_rows) for Tax Liability accounts matching the period.

    Accounts with a non-zero balance go to in_scope; zero-balance go to eligible.
    """
    tax_rows = [
        r for r in rows
        if r["account_type"] == "Tax Liability" and period_name in r["account"].name
    ]
    if not tax_rows:
        return [], []

    event_repo = AccountEventRepository(session)
    in_scope: list[dict[str, Any]] = []
    eligible: list[dict[str, Any]] = []

    for row in tax_rows:
        balance_str = await event_repo.get_latest_balance_update(row["account"].id, user_id)
        balance = float(balance_str or "0")
        if balance > 0:
            in_scope.append({**row, "eligibility_reason": "in_scope", "_tax_balance": balance})
        else:
            eligible.append({**row, "eligibility_reason": "tax_liability", "_tax_balance": balance})

    return in_scope, eligible
