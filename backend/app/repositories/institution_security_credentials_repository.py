"""
Repository for institution security credentials.
"""
from typing import Optional, Sequence, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.institution import Institution
from app.models.institution_security_credentials import InstitutionSecurityCredentials
from app.models.reference_data import ReferenceData
from app.schemas.institution_security_credentials import InstitutionSecurityCredentialCreate


class InstitutionSecurityCredentialsRepository:
    """Handles credential persistence with ownership enforcement."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_for_institution(
        self, institution_id: int, user_id: int
    ) -> Sequence[Tuple[InstitutionSecurityCredentials, str]]:
        stmt = (
            select(
                InstitutionSecurityCredentials,
                ReferenceData.reference_value.label("type_label"),
            )
            .join(
                Institution,
                InstitutionSecurityCredentials.institution_id == Institution.id,
            )
            .join(
                ReferenceData,
                InstitutionSecurityCredentials.type_id == ReferenceData.id,
            )
            .where(InstitutionSecurityCredentials.institution_id == institution_id)
            .where(Institution.user_id == user_id)
            .order_by(InstitutionSecurityCredentials.created_at.desc())
        )
        result = await self.session.execute(stmt)
        rows = result.all()
        return list(map(tuple, rows))

    async def get_by_id(
        self, credential_id: int, user_id: int
    ) -> Optional[Tuple[InstitutionSecurityCredentials, str]]:
        stmt = (
            select(
                InstitutionSecurityCredentials,
                ReferenceData.reference_value.label("type_label"),
            )
            .join(
                Institution,
                InstitutionSecurityCredentials.institution_id == Institution.id,
            )
            .join(
                ReferenceData,
                InstitutionSecurityCredentials.type_id == ReferenceData.id,
            )
            .where(InstitutionSecurityCredentials.id == credential_id)
            .where(Institution.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        first = result.first()
        if not first:
            return None
        return tuple(first)

    async def create(
        self,
        user_id: int,
        institution_id: int,
        payload: InstitutionSecurityCredentialCreate,
    ) -> InstitutionSecurityCredentials:
        credential = InstitutionSecurityCredentials()
        credential.user_id = user_id
        credential.institution_id = institution_id
        credential.type_id = payload.type_id
        credential.key = payload.key
        credential.value = payload.value

        self.session.add(credential)
        await self.session.flush()
        await self.session.refresh(credential)
        return credential

    async def update(
        self,
        credential: InstitutionSecurityCredentials,
        type_id: Optional[int] = None,
        key: Optional[str] = None,
        value: Optional[str] = None,
    ) -> InstitutionSecurityCredentials:
        if type_id is not None:
            credential.type_id = type_id
        if key is not None:
            credential.key = key
        if value is not None:
            credential.value = value
        self.session.add(credential)
        await self.session.flush()
        await self.session.refresh(credential)
        return credential

    async def delete(self, credential: InstitutionSecurityCredentials) -> None:
        await self.session.delete(credential)
        await self.session.flush()

    async def get_type(self, type_id: int) -> Optional[ReferenceData]:
        return await self.session.get(ReferenceData, type_id)
