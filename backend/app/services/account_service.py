"""
Service for account business logic and mutations.
"""
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.account_repository import AccountRepository


class AccountService:
    """Handles all account write operations and business logic."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize with database session."""
        self.session = session
        self.repository = AccountRepository(session)

    async def update(self, account_id: int, user_id: int, **kwargs: Any) -> bool:
        """Update account details. Returns True if successful."""
        account = await self.repository.get_by_id(account_id, user_id)
        if not account:
            raise ValueError(f"Account {account_id} not found")

        allowed_fields = {"name", "type_id", "status_id"}
        for key, value in kwargs.items():
            if key in allowed_fields and value is not None:
                setattr(account, key, value)

        self.session.add(account)
        await self.session.flush()
        return True

    async def delete(self, account_id: int, user_id: int) -> bool:
        """Delete account. Returns True if successful."""
        account = await self.repository.get_by_id(account_id, user_id)
        if not account:
            raise ValueError(f"Account {account_id} not found")

        await self.session.delete(account)
        await self.session.flush()
        return True
