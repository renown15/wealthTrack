"""
Service for institution business logic and mutations.
"""
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.institution_repository import InstitutionRepository


class InstitutionService:
    """Handles all institution write operations and business logic."""

    def __init__(self, session: AsyncSession):
        """Initialize with database session."""
        self.session = session
        self.repository = InstitutionRepository(session)

    async def update(self, institution_id: int, user_id: int, name: str) -> bool:
        """Update institution details. Returns True if successful."""
        institution = await self.repository.get_by_id(institution_id, user_id)
        if not institution:
            raise ValueError(f"Institution {institution_id} not found")

        institution.name = name
        self.session.add(institution)
        await self.session.flush()
        return True

    async def delete(self, institution_id: int, user_id: int) -> bool:
        """Delete institution. Returns True if successful."""
        institution = await self.repository.get_by_id(institution_id, user_id)
        if not institution:
            raise ValueError(f"Institution {institution_id} not found")

        await self.session.delete(institution)
        await self.session.flush()
        return True
