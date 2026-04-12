"""
Tax service — eligible account discovery and tax return orchestration.
"""
from datetime import datetime, time
from datetime import date as date_type
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.account_event import AccountEvent
from app.models.reference_data import ReferenceData
from app.repositories.event_group_repository import EventGroupRepository
from app.repositories.tax_document_repository import TaxDocumentRepository
from app.repositories.tax_return_repository import TaxReturnRepository
from app.services.tax_service_helpers import fetch_accounts_with_attrs, filter_eligible

_SHARES_TYPE = "Shares"


async def get_eligible_with_returns(
    session: AsyncSession,
    user_id: int,
    tax_period_id: int,
    period_start: date_type,
    period_end: date_type,
) -> list[dict[str, Any]]:
    """Return eligible accounts enriched with TaxReturn and document data."""
    rows = await fetch_accounts_with_attrs(session, user_id)

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

    eligible = filter_eligible(rows, period_start, period_end, accounts_with_sales)

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

        capital_gain = None
        tax_taken_off = None

        if account_type == _SHARES_TYPE:
            groups = await group_repo.get_groups_for_account(account.id, user_id, "Share Sale")
            total_capital_gain = 0.0
            total_tax = 0.0
            for group in groups:
                for attr in group.get("attributes", []):
                    attr_type_normalized = attr["attribute_type"].lower().replace(" ", "_")
                    if "capital_gain" in attr_type_normalized:
                        try:
                            total_capital_gain += float(attr["value"])
                        except (ValueError, TypeError):
                            pass
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
