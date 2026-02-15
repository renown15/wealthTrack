"""
Repository for institution group (parent-child relationships) operations.
"""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.institution_group import InstitutionGroup


class InstitutionGroupRepository:
    """Handles institution group read/write operations."""

    def __init__(self, session: AsyncSession):
        """Initialize with database session."""
        self.session = session

    async def get_parent_for_child(
        self, child_institution_id: int, user_id: int
    ) -> Optional[InstitutionGroup]:
        """Get parent institution for a given child institution."""
        stmt = (
            select(InstitutionGroup)
            .where(InstitutionGroup.child_institution_id == child_institution_id)
            .where(InstitutionGroup.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_children_for_parent(
        self, parent_institution_id: int, user_id: int
    ) -> list[InstitutionGroup]:
        """Get all child institutions for a parent institution."""
        stmt = (
            select(InstitutionGroup)
            .where(InstitutionGroup.parent_institution_id == parent_institution_id)
            .where(InstitutionGroup.user_id == user_id)
            .order_by(InstitutionGroup.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def set_parent(
        self, child_institution_id: int, parent_institution_id: int, user_id: int
    ) -> InstitutionGroup:
        """Set or update parent institution for a child."""
        # Remove existing parent relationship if any
        await self.remove_parent(child_institution_id, user_id)

        # Create new relationship
        group = InstitutionGroup()
        group.user_id = user_id
        group.parent_institution_id = parent_institution_id
        group.child_institution_id = child_institution_id
        self.session.add(group)
        await self.session.flush()
        await self.session.refresh(group)
        return group

    async def remove_parent(self, child_institution_id: int, user_id: int) -> None:
        """Remove parent relationship for a child institution."""
        stmt = (
            select(InstitutionGroup)
            .where(InstitutionGroup.child_institution_id == child_institution_id)
            .where(InstitutionGroup.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        group = result.scalar_one_or_none()
        if group:
            await self.session.delete(group)
            await self.session.flush()

    async def delete_by_id(self, group_id: int, user_id: int) -> None:
        """Delete an institution group by ID."""
        stmt = (
            select(InstitutionGroup)
            .where(InstitutionGroup.id == group_id)
            .where(InstitutionGroup.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        group = result.scalar_one_or_none()
        if group:
            await self.session.delete(group)
            await self.session.flush()
