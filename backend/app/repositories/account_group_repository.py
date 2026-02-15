"""
Repository for account group operations.
"""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.account_group import AccountGroup
from app.models.account_group_member import AccountGroupMember


class AccountGroupRepository:
    """Handles CRUD operations for account groups."""

    def __init__(self, session: AsyncSession):
        """Initialize repository with an async session."""
        self.session = session

    async def create(self, user_id: int, name: str) -> AccountGroup:
        """Create a new account group."""
        group = AccountGroup()
        group.user_id = user_id
        group.name = name
        self.session.add(group)
        await self.session.flush()
        await self.session.refresh(group)
        return group

    async def get_by_id(self, group_id: int, user_id: int) -> Optional[AccountGroup]:
        """Get an account group by ID (with user authorization check)."""
        stmt = (
            select(AccountGroup)
            .where(
                AccountGroup.id == group_id,
                AccountGroup.user_id == user_id,
            )
            .options(selectinload(AccountGroup.members))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user(self, user_id: int) -> list[AccountGroup]:
        """Get all account groups for a user."""
        stmt = (
            select(AccountGroup)
            .where(AccountGroup.user_id == user_id)
            .options(selectinload(AccountGroup.members))
            .order_by(AccountGroup.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update(self, group_id: int, user_id: int, name: str) -> Optional[AccountGroup]:
        """Update an account group."""
        group = await self.get_by_id(group_id, user_id)
        if not group:
            return None
        group.name = name
        await self.session.flush()
        await self.session.refresh(group)
        return group

    async def delete(self, group_id: int, user_id: int) -> bool:
        """Delete an account group and all its members."""
        group = await self.get_by_id(group_id, user_id)
        if not group:
            return False
        await self.session.delete(group)
        await self.session.flush()
        return True

    async def add_member(self, group_id: int, user_id: int, account_id: int) -> Optional[AccountGroupMember]:
        """Add an account to a group."""
        group = await self.get_by_id(group_id, user_id)
        if not group:
            return None

        # Check if already a member
        existing_stmt = select(AccountGroupMember).where(
            AccountGroupMember.account_group_id == group_id,
            AccountGroupMember.account_id == account_id,
        )
        existing_result = await self.session.execute(existing_stmt)
        if existing_result.scalar_one_or_none():
            return None

        member = AccountGroupMember()
        member.account_group_id = group_id
        member.account_id = account_id
        self.session.add(member)
        await self.session.flush()
        await self.session.refresh(member)
        return member

    async def remove_member(self, group_id: int, user_id: int, account_id: int) -> bool:
        """Remove an account from a group."""
        group = await self.get_by_id(group_id, user_id)
        if not group:
            return False

        stmt = select(AccountGroupMember).where(
            AccountGroupMember.account_group_id == group_id,
            AccountGroupMember.account_id == account_id,
        )
        result = await self.session.execute(stmt)
        member = result.scalar_one_or_none()
        if not member:
            return False

        await self.session.delete(member)
        await self.session.flush()
        return True

    async def get_group_members(self, group_id: int, user_id: int) -> list[int]:
        """Get all account IDs in a group."""
        group = await self.get_by_id(group_id, user_id)
        if not group:
            return []
        return [member.account_id for member in group.members]
