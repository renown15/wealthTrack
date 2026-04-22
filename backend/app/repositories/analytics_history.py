"""Portfolio history computation for analytics."""
from collections import defaultdict
from datetime import date, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.account_event import AccountEvent
from app.models.reference_data import ReferenceData

HISTORY_START_DATE = date(2026, 2, 15)


async def get_portfolio_history(session: AsyncSession, user_id: int) -> dict[str, Any]:
    """Return the daily portfolio total from the earliest balance record up to today."""
    baseline_result = await session.execute(
        select(ReferenceData.reference_value).where(
            ReferenceData.class_key == "analytics_baseline_date"
        )
    )
    baseline_date_str = baseline_result.scalar() or None

    balance_type_subq = (
        select(ReferenceData.id)
        .where(
            ReferenceData.class_key == "account_event_type",
            ReferenceData.reference_value == "Balance Update",
        )
        .scalar_subquery()
    )
    stmt = (
        select(AccountEvent.account_id, AccountEvent.created_at, AccountEvent.value)
        .join(Account, Account.id == AccountEvent.account_id)
        .where(Account.user_id == user_id)
        .where(AccountEvent.type_id == balance_type_subq)
        .order_by(AccountEvent.created_at)
    )
    result = await session.execute(stmt)
    rows = result.all()
    if not rows:
        return {"baseline_date": baseline_date_str, "history": []}

    events_by_date: dict[date, dict[int, float]] = defaultdict(dict)
    for account_id, created_at, raw_value in rows:
        try:
            val = float(raw_value)
        except (TypeError, ValueError):
            continue
        event_date = (
            created_at.date()
            if hasattr(created_at, "date")
            else date.fromisoformat(str(created_at)[:10])
        )
        events_by_date[event_date][account_id] = val

    today = date.today()
    account_balances: dict[int, float] = {}
    for past_date in sorted(d for d in events_by_date if d < HISTORY_START_DATE):
        account_balances.update(events_by_date[past_date])

    first_date = max(min(events_by_date), HISTORY_START_DATE)
    history: list[dict[str, Any]] = []
    current = first_date
    while current <= today:
        if current in events_by_date:
            account_balances.update(events_by_date[current])
        total = sum(v for v in account_balances.values() if v > 0)
        history.append({"date": current.isoformat(), "total_value": round(total, 2)})
        current += timedelta(days=1)

    return {"baseline_date": baseline_date_str, "history": history}
