"""
Repository for analytics data — portfolio history and breakdown queries.
"""
import logging
from collections import defaultdict
from datetime import date, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.account import Account
from app.models.account_attribute import AccountAttribute
from app.models.account_event import AccountEvent
from app.models.institution import Institution
from app.models.reference_data import ReferenceData

logger = logging.getLogger(__name__)

# Earliest date that portfolio history will be shown from, regardless of when
# balance records were first entered.
HISTORY_START_DATE = date(2026, 2, 15)


class AnalyticsRepository:
    """Provides aggregated data for analytics charts."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
    async def get_portfolio_breakdown(self, user_id: int) -> dict[str, Any]:
        """Return current portfolio value broken down by account type, institution
        and asset class. Uses the latest event value per account."""
        max_date_subq = (
            select(
                AccountEvent.account_id,
                func.max(AccountEvent.created_at).label("max_date"),
            )
            .join(Account, Account.id == AccountEvent.account_id)
            .where(Account.user_id == user_id)
            .group_by(AccountEvent.account_id)
            .subquery()
        )
        asset_class_type_id_subq = (
            select(ReferenceData.id)
            .where(ReferenceData.class_key == "account_attribute_type", ReferenceData.reference_value == "Asset Class")
            .scalar_subquery()
        )
        status_rd = aliased(ReferenceData)
        asset_class_attr = aliased(AccountAttribute)
        stmt = (
            select(
                Account.id.label("account_id"),
                Account.name.label("account_name"),
                ReferenceData.reference_value.label("account_type"),
                Institution.name.label("institution"),
                AccountEvent.value,
                asset_class_attr.value.label("asset_class"),
                status_rd.reference_value.label("account_status"),
            )
            .select_from(Account)
            .join(max_date_subq, max_date_subq.c.account_id == Account.id)
            .join(
                AccountEvent,
                (AccountEvent.account_id == Account.id)
                & (AccountEvent.created_at == max_date_subq.c.max_date),
            )
            .join(ReferenceData, ReferenceData.id == Account.type_id)
            .outerjoin(Institution, Institution.id == Account.institution_id)
            .outerjoin(
                asset_class_attr,
                (asset_class_attr.account_id == Account.id)
                & (asset_class_attr.user_id == user_id)
                & (asset_class_attr.type_id == asset_class_type_id_subq),
            )
            .outerjoin(status_rd, status_rd.id == Account.status_id)
            .where(Account.user_id == user_id)
        )

        result = await self.session.execute(stmt)
        rows = result.all()
        by_type: dict[str, float] = {}
        by_institution: dict[str, float] = {}
        by_asset_class: dict[str, float] = {}
        by_asset_class_no_pension: dict[str, float] = {}
        by_type_accts: dict[str, list[dict[str, Any]]] = {}
        by_inst_accts: dict[str, list[dict[str, Any]]] = {}
        by_ac_accts: dict[str, list[dict[str, Any]]] = {}
        by_ac_no_pension_accts: dict[str, list[dict[str, Any]]] = {}
        total = 0.0
        for account_id, account_name, account_type, institution, raw_value, asset_class, account_status in rows:
            try:
                val = float(raw_value)
            except (TypeError, ValueError):
                continue
            if val <= 0:
                continue
            total += val
            inst = institution or "Unknown"
            ac = asset_class or "Unclassified"
            by_type[account_type] = by_type.get(account_type, 0.0) + val
            by_institution[inst] = by_institution.get(inst, 0.0) + val
            by_asset_class[ac] = by_asset_class.get(ac, 0.0) + val
            is_closed = (account_status or "").lower() == "closed"
            detail = {"account_id": account_id, "account_name": account_name, "institution_name": inst, "balance": round(val, 2), "is_closed": is_closed}
            by_type_accts.setdefault(account_type, []).append(detail)
            by_inst_accts.setdefault(inst, []).append(detail)
            by_ac_accts.setdefault(ac, []).append(detail)
            if "pension" not in account_type.lower():
                by_asset_class_no_pension[ac] = by_asset_class_no_pension.get(ac, 0.0) + val
                by_ac_no_pension_accts.setdefault(ac, []).append(detail)

        def _sorted_accts(d: dict[str, list[dict[str, Any]]], k: str) -> list[dict[str, Any]]:
            return sorted(d.get(k, []), key=lambda x: -x["balance"])

        return {
            "by_type": [
                {"label": k, "value": round(v, 2), "accounts": _sorted_accts(by_type_accts, k)}
                for k, v in sorted(by_type.items(), key=lambda x: -x[1])
            ],
            "by_institution": [
                {"label": k, "value": round(v, 2), "accounts": _sorted_accts(by_inst_accts, k)}
                for k, v in sorted(by_institution.items(), key=lambda x: -x[1])
            ],
            "by_asset_class": [
                {"label": k, "value": round(v, 2), "accounts": _sorted_accts(by_ac_accts, k)}
                for k, v in sorted(by_asset_class.items(), key=lambda x: -x[1])
            ],
            "by_asset_class_no_pension": [
                {"label": k, "value": round(v, 2), "accounts": _sorted_accts(by_ac_no_pension_accts, k)}
                for k, v in sorted(by_asset_class_no_pension.items(), key=lambda x: -x[1])
            ],
            "total": round(total, 2),
        }
    async def get_portfolio_history(self, user_id: int) -> dict[str, Any]:
        """
        Return the daily portfolio total from the date of the earliest balance
        record up to today, along with the baseline_date for analytics.

        Each account's balance carries forward unchanged until the next balance
        record is written, so every day has an exact total.
        """
        # Get baseline date from reference data (global setting, not user-specific)
        baseline_result = await self.session.execute(
            select(ReferenceData.reference_value).where(ReferenceData.class_key == "analytics_baseline_date")
        )
        baseline_date_str = baseline_result.scalar() or None

        stmt = (
            select(AccountEvent.account_id, AccountEvent.created_at, AccountEvent.value)
            .join(Account, Account.id == AccountEvent.account_id)
            .where(Account.user_id == user_id)
            .order_by(AccountEvent.created_at)
        )
        result = await self.session.execute(stmt)
        rows = result.all()
        if not rows:
            return {"baseline_date": baseline_date_str, "history": []}
        events_by_date: dict[date, dict[int, float]] = defaultdict(dict)
        for account_id, created_at, raw_value in rows:
            try:
                val = float(raw_value)
            except (TypeError, ValueError):
                continue
            event_date = created_at.date() if hasattr(created_at, "date") else date.fromisoformat(str(created_at)[:10])
            # Overwrite — rows are ordered by created_at so the last row for
            # this (date, account) is the latest value on that day
            events_by_date[event_date][account_id] = val

        today = date.today()

        # Seed account_balances with any events recorded before the cap date so
        # their values carry forward correctly into the visible window.
        account_balances: dict[int, float] = {}
        for past_date in sorted(d for d in events_by_date if d < HISTORY_START_DATE):
            account_balances.update(events_by_date[past_date])

        # Start the visible history from whichever is later: the cap date or the
        # date of the first recorded event.
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
