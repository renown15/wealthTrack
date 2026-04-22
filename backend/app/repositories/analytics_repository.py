"""
Repository for analytics data — portfolio history and breakdown queries.
"""
import logging
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.account import Account
from app.models.account_attribute import AccountAttribute
from app.models.account_event import AccountEvent
from app.models.institution import Institution
from app.models.reference_data import ReferenceData
from app.repositories.analytics_history import get_portfolio_history as _get_history

logger = logging.getLogger(__name__)


class AnalyticsRepository:
    """Provides aggregated data for analytics charts."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_portfolio_breakdown(self, user_id: int) -> dict[str, Any]:
        """Return current portfolio value broken down by account type, institution
        and asset class. Uses the latest event value per account."""
        balance_update_type_id_subq = (
            select(ReferenceData.id)
            .where(
                ReferenceData.class_key == "account_event_type",
                ReferenceData.reference_value == "Balance Update",
            )
            .scalar_subquery()
        )
        max_date_subq = (
            select(
                AccountEvent.account_id,
                func.max(AccountEvent.created_at).label("max_date"),
            )
            .join(Account, Account.id == AccountEvent.account_id)
            .where(Account.user_id == user_id)
            .where(AccountEvent.type_id == balance_update_type_id_subq)
            .group_by(AccountEvent.account_id)
            .subquery()
        )
        asset_class_type_id_subq = (
            select(ReferenceData.id)
            .where(
                ReferenceData.class_key == "account_attribute_type",
                ReferenceData.reference_value == "Asset Class",
            )
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
        for (
            account_id,
            account_name,
            account_type,
            institution,
            raw_value,
            asset_class,
            account_status,
        ) in rows:
            try:
                val = float(raw_value)
            except (TypeError, ValueError):
                continue
            # Negate Tax Liability accounts (they are liabilities, not assets)
            if account_type == "Tax Liability":
                val = -val
            total += val
            inst = institution or "Unknown"
            ac = asset_class or "Unclassified"
            by_type[account_type] = by_type.get(account_type, 0.0) + val
            by_institution[inst] = by_institution.get(inst, 0.0) + val
            by_asset_class[ac] = by_asset_class.get(ac, 0.0) + val
            is_closed = (account_status or "").lower() == "closed"
            detail = {
                "account_id": account_id,
                "account_name": account_name,
                "institution_name": inst,
                "balance": round(val, 2),
                "is_closed": is_closed,
            }
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
                {
                    "label": k,
                    "value": round(v, 2),
                    "accounts": _sorted_accts(by_ac_no_pension_accts, k),
                }
                for k, v in sorted(by_asset_class_no_pension.items(), key=lambda x: -x[1])
            ],
            "total": round(total, 2),
        }

    async def get_portfolio_history(self, user_id: int) -> dict[str, Any]:
        """Return the daily portfolio total up to today, with baseline_date for analytics."""
        return await _get_history(self.session, user_id)
