"""
Service for institution business logic and mutations.
"""
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.institution_security_credentials import InstitutionSecurityCredentials
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
        """Delete institution and all related records. Returns True if successful."""
        institution = await self.repository.get_by_id(institution_id, user_id)
        if not institution:
            raise ValueError(f"Institution {institution_id} not found")

        # Delete all security credentials for this institution first
        cred_stmt = delete(InstitutionSecurityCredentials).where(
            InstitutionSecurityCredentials.institution_id == institution_id
        )
        await self.session.execute(cred_stmt)

        # Then delete all accounts for this institution
        account_stmt = delete(Account).where(Account.institution_id == institution_id)
        await self.session.execute(account_stmt)

        # Finally delete the institution itself
        await self.session.delete(institution)
        await self.session.flush()
        return True
