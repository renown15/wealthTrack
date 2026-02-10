"""
Repository for account event read operations.
"""
from typing import Any

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account_event import AccountEvent
from app.models.reference_data import ReferenceData


class AccountEventRepository:
    """Handles read operations for account events including history and counts."""

    def __init__(self, session: AsyncSession):
        """Initialize repository with an async session."""
        self.session = session

    async def list_events(self, account_id: int, user_id: int) -> list[dict[str, Any]]:
        """Return chronological account events for the given user-owned account."""
        stmt = (
            select(AccountEvent, ReferenceData.reference_value)
            .join(ReferenceData, ReferenceData.id == AccountEvent.type_id)
            .where(AccountEvent.account_id == account_id)
            .where(AccountEvent.user_id == user_id)
            .order_by(desc(AccountEvent.created_at))
        )
        result = await self.session.execute(stmt)
        events: list[dict[str, Any]] = []
        for event, reference_value in result.all():
            events.append(
                {
                    "id": event.id,
                    "account_id": event.account_id,
                    "user_id": event.user_id,
                    "event_type": reference_value or "Event",
                    "value": event.value,
                    "created_at": event.created_at,
                }
            )
        return events
