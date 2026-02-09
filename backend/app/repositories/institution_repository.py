"""
Repository for institution read operations.
"""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.institution import Institution


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
