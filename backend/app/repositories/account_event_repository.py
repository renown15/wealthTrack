"""
Repository for account event read operations.
"""
from typing import Any

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account_event import AccountEvent
from app.models.reference_data import ReferenceData
from app.types.event_types import EventType

# Maps shorthand keys → full ReferenceData.reference_value labels
_EVENT_SHORTHAND_MAP: dict[str, str] = {
    "balance": EventType.BALANCE_UPDATE,
    "balance update": EventType.BALANCE_UPDATE,
    "interest": EventType.INTEREST,
    "dividend": EventType.DIVIDEND,
    "deposit": EventType.DEPOSIT,
    "withdrawal": EventType.WITHDRAWAL,
    "win": EventType.WIN,
    "fee": EventType.FEE,
    "tax": EventType.TAX,
}


class AccountEventRepository:
    """Handles operations for account events including history and counts."""

    def __init__(self, session: AsyncSession):
        """Initialize repository with an async session."""
        self.session = session

    async def get_event_type_id(self, event_type: str) -> int | None:
        """Look up the reference data ID for an event type.

        Accepts either the full reference_value (e.g., "Balance Update")
        or a shorthand (e.g., "balance") which maps to "Balance Update".
        """
        lookup_value = _EVENT_SHORTHAND_MAP.get(event_type.lower(), event_type)

        stmt = select(ReferenceData.id).where(
            ReferenceData.class_key == "account_event_type",
            ReferenceData.reference_value == lookup_value,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_event(
        self, account_id: int, user_id: int, type_id: int, value: str
    ) -> AccountEvent:
        """Create a new account event."""
        event = AccountEvent()
        event.account_id = account_id
        event.user_id = user_id
        event.type_id = type_id
        event.value = value
        self.session.add(event)
        await self.session.flush()
        await self.session.refresh(event)
        return event

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
