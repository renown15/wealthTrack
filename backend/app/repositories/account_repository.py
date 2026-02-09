"""
Repository for account read operations.
"""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.account import Account


class AccountRepository:
    """Handles account read operations for management."""

    def __init__(self, session: AsyncSession):
        """Initialize with database session."""
        self.session = session

    async def get_by_id(self, account_id: int, user_id: int) -> Optional[Account]:
        """Get account by ID, ensuring user ownership."""
        stmt = (
            select(Account)
            .where(Account.id == account_id)
            .where(Account.user_id == user_id)
            .options(selectinload(Account.institution))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user(self, user_id: int) -> list[Account]:
        """Get all accounts for user with institutions."""
        stmt = (
            select(Account)
            .where(Account.user_id == user_id)
            .options(selectinload(Account.institution))
            .order_by(Account.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_institution(
        self, user_id: int, institution_id: int
    ) -> list[Account]:
        """Get accounts for user filtered by institution."""
        stmt = (
            select(Account)
            .where(Account.user_id == user_id)
            .where(Account.institution_id == institution_id)
            .options(selectinload(Account.institution))
            .order_by(Account.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
