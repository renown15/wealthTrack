"""
Service for account events (balance history).
"""
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account_event import AccountEvent
from app.repositories.account_repository import AccountRepository


class AccountEventService:
    """Handles account event operations (balance logging)."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize with database session."""
        self.session = session
        self.account_repository = AccountRepository(session)

    async def log_event(
        self, user_id: int, account_id: int, type_id: int, value: str
    ) -> bool:
        """Log a new account event (balance update). Returns True if successful."""
        # Verify account belongs to user
        account = await self.account_repository.get_by_id(account_id, user_id)
        if not account:
            raise ValueError(f"Account {account_id} not found")

        event = AccountEvent()
        event.user_id = user_id
        event.account_id = account_id
        event.type_id = type_id
        event.value = value

        self.session.add(event)
        await self.session.flush()
        return True
