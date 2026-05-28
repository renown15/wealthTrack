"""Repository for Family CRUD operations."""
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.family import Family
from app.models.family_member_account import FamilyMemberAccount
from app.models.user_profile import UserProfile


class FamilyRepository:
    """Handles CRUD operations for families and their members."""

    def __init__(self, session: AsyncSession):
        self.session = session

    def _with_members(self) -> Any:
        return selectinload(Family.members).selectinload(FamilyMemberAccount.member)

    async def get_families_for_user(self, user_id: int) -> list[Family]:
        """Get all families the user belongs to (as owner or member)."""
        stmt = (
            select(Family)
            .join(FamilyMemberAccount, FamilyMemberAccount.family_id == Family.id)
            .where(FamilyMemberAccount.account_id == user_id)
            .options(self._with_members())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().unique().all())

    async def get_by_id(self, family_id: int) -> Optional[Family]:
        """Get a family by ID with members eagerly loaded (always fresh from DB)."""
        stmt = (
            select(Family)
            .where(Family.id == family_id)
            .options(self._with_members())
            .execution_options(populate_existing=True)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_owned_family(self, owner_id: int) -> Optional[Family]:
        """Get the family owned by this user, if any."""
        stmt = select(Family).where(Family.owner_id == owner_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, name: str, owner_id: int) -> Family:
        """Create a family and add the owner as the first member."""
        family = Family()
        family.name = name
        family.owner_id = owner_id
        self.session.add(family)
        await self.session.flush()
        await self.session.refresh(family)
        await self._add_member_row(family.id, owner_id)
        await self.session.flush()
        stmt = (
            select(Family)
            .where(Family.id == family.id)
            .options(self._with_members())
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def update_name(self, family_id: int, name: str) -> Family:
        """Rename a family."""
        family = await self.get_by_id(family_id)
        family.name = name  # type: ignore[union-attr]
        await self.session.flush()
        await self.session.refresh(family)
        return family  # type: ignore[return-value]

    async def delete(self, family_id: int) -> None:
        """Delete a family — explicitly removes members first to avoid FK constraint issues."""
        member_stmt = select(FamilyMemberAccount).where(
            FamilyMemberAccount.family_id == family_id
        )
        members = (await self.session.execute(member_stmt)).scalars().all()
        for member in members:
            await self.session.delete(member)
        await self.session.flush()
        family = await self.session.get(Family, family_id)
        if family:
            await self.session.delete(family)
            await self.session.flush()

    async def _add_member_row(self, family_id: int, account_id: int) -> FamilyMemberAccount:
        member = FamilyMemberAccount()
        member.family_id = family_id
        member.account_id = account_id
        self.session.add(member)
        return member

    async def add_member(self, family_id: int, account_id: int) -> Optional[FamilyMemberAccount]:
        """Add a user to a family. Returns None if already a member."""
        exists_stmt = select(FamilyMemberAccount).where(
            FamilyMemberAccount.family_id == family_id,
            FamilyMemberAccount.account_id == account_id,
        )
        if (await self.session.execute(exists_stmt)).scalar_one_or_none():
            return None
        row = await self._add_member_row(family_id, account_id)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def remove_member(self, family_id: int, account_id: int) -> bool:
        """Remove a user from a family. Returns False if not a member."""
        stmt = select(FamilyMemberAccount).where(
            FamilyMemberAccount.family_id == family_id,
            FamilyMemberAccount.account_id == account_id,
        )
        row = (await self.session.execute(stmt)).scalar_one_or_none()
        if not row:
            return False
        await self.session.delete(row)
        await self.session.flush()
        return True

    async def is_member(self, family_id: int, user_id: int) -> bool:
        """Return True if the user belongs to this family."""
        stmt = select(FamilyMemberAccount).where(
            FamilyMemberAccount.family_id == family_id,
            FamilyMemberAccount.account_id == user_id,
        )
        return (await self.session.execute(stmt)).scalar_one_or_none() is not None

    async def get_member_ids_for_user(self, user_id: int) -> list[int]:
        """Return all family member account IDs in the same family, excluding self."""
        family_ids_stmt = (
            select(FamilyMemberAccount.family_id)
            .where(FamilyMemberAccount.account_id == user_id)
        )
        stmt = (
            select(FamilyMemberAccount.account_id)
            .where(
                FamilyMemberAccount.family_id.in_(family_ids_stmt),
                FamilyMemberAccount.account_id != user_id,
            )
        )
        result = await self.session.execute(stmt)
        return [row[0] for row in result.all()]

    async def get_available_members(self, family_id: int) -> list[UserProfile]:
        """Return all active users not already in this family."""
        existing_stmt = select(FamilyMemberAccount.account_id).where(
            FamilyMemberAccount.family_id == family_id
        )
        existing_result = await self.session.execute(existing_stmt)
        existing_ids = [row[0] for row in existing_result.all()]
        stmt = (
            select(UserProfile)
            .where(
                UserProfile.id.notin_(existing_ids),
                UserProfile.is_active.is_(True),
            )
            .order_by(UserProfile.first_name, UserProfile.last_name)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
