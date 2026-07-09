"""
Repository for institution read operations.
"""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.institution import Institution
from app.models.institution_group import InstitutionGroup


class InstitutionRepository:
    """Handles institution read operations."""

    def __init__(self, session: AsyncSession):
        """Initialize with database session."""
        self.session = session

    async def get_by_id(self, institution_id: int, user_id: int) -> Optional[Institution]:
        """Get institution by ID, ensuring user ownership."""
        stmt = (
            select(Institution)
            .where(Institution.id == institution_id)
            .where(Institution.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user(self, user_id: int) -> list[Institution]:
        """Get all institutions for user."""
        stmt = (
            select(Institution)
            .where(Institution.user_id == user_id)
            .order_by(Institution.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_user_ids(
        self, user_ids: list[int], account_owner_ids: Optional[list[int]] = None
    ) -> list[Institution]:
        """Get institutions owned by `user_ids` that hold at least one account.

        `account_owner_ids` widens whose accounts count towards "holds an
        account" — e.g. the viewing user's own accounts may sit at another
        family member's institution (a child's bare trust at the parent's
        bank). Group parents of matched institutions are included too, since
        they often hold no accounts directly but anchor their children's
        grouping in the UI.
        """
        if not user_ids:
            return []
        owner_ids = account_owner_ids or user_ids
        has_account = select(Account.institution_id).where(Account.user_id.in_(owner_ids))
        stmt = (
            select(Institution)
            .where(
                Institution.user_id.in_(user_ids),
                Institution.id.in_(has_account),
            )
            .order_by(Institution.created_at.desc())
        )
        result = await self.session.execute(stmt)
        institutions = list(result.scalars().all())

        matched_ids = [i.id for i in institutions]
        if not matched_ids:
            return institutions
        parent_ids_stmt = select(InstitutionGroup.parent_institution_id).where(
            InstitutionGroup.child_institution_id.in_(matched_ids)
        )
        parents_stmt = select(Institution).where(
            Institution.user_id.in_(user_ids),
            Institution.id.in_(parent_ids_stmt),
            Institution.id.not_in(matched_ids),
        )
        parents = (await self.session.execute(parents_stmt)).scalars().all()
        return institutions + list(parents)
