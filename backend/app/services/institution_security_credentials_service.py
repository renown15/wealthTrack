"""
Service layer for institution credentials management.
"""
from typing import Any, Dict, List

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.institution_security_credentials import InstitutionSecurityCredentials
from app.repositories.institution_repository import InstitutionRepository
from app.repositories.institution_security_credentials_repository import (
    InstitutionSecurityCredentialsRepository,
)
from app.schemas.institution_security_credentials import (
    InstitutionSecurityCredentialCreate,
    InstitutionSecurityCredentialUpdate,
)


class InstitutionSecurityCredentialsService:
    """Handles credential creation, updates, and listing."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = InstitutionSecurityCredentialsRepository(session)
        self.institution_repository = InstitutionRepository(session)

    async def list_for_institution(
        self, institution_id: int, user_id: int
    ) -> List[Dict[str, Any]]:
        rows = await self.repository.list_for_institution(institution_id, user_id)
        return [self._to_payload(credential, type_label) for credential, type_label in rows]

    async def create(
        self,
        institution_id: int,
        user_id: int,
        payload: InstitutionSecurityCredentialCreate,
    ) -> Dict[str, Any]:
        institution = await self.institution_repository.get_by_id(institution_id, user_id)
        if not institution:
            raise ValueError(f"Institution {institution_id} not found")

        type_label = await self._ensure_credential_type(payload.type_id)
        credential = await self.repository.create(
            user_id,
            institution_id,
            payload,
        )
        return self._to_payload(credential, type_label)

    async def update(
        self,
        institution_id: int,
        credential_id: int,
        user_id: int,
        payload: InstitutionSecurityCredentialUpdate,
    ) -> Dict[str, Any]:
        row = await self.repository.get_by_id(credential_id, user_id)
        if not row:
            raise ValueError(f"Credential {credential_id} not found")

        credential, _ = row
        if credential.institution_id != institution_id:
            raise ValueError("Credential does not belong to the requested institution")

        final_type_id = payload.type_id if payload.type_id is not None else credential.type_id
        type_label = await self._ensure_credential_type(final_type_id)

        updated = await self.repository.update(
            credential,
            type_id=payload.type_id,
            key=payload.key,
            value=payload.value,
        )
        return self._to_payload(updated, type_label)

    async def delete(self, credential_id: int, user_id: int) -> None:
        row = await self.repository.get_by_id(credential_id, user_id)
        if not row:
            raise ValueError(f"Credential {credential_id} not found")
        credential, _ = row
        await self.repository.delete(credential)

    async def _ensure_credential_type(self, type_id: int) -> str:
        record = await self.repository.get_type(type_id)
        if not record or not record.class_key.startswith("credential_type"):
            raise ValueError("Invalid credential type")
        return record.reference_value

    @staticmethod
    def _to_payload(credential: InstitutionSecurityCredentials, type_label: str) -> Dict[str, Any]:
        return {
            "id": credential.id,
            "institution_id": credential.institution_id,
            "type_id": credential.type_id,
            "type_label": type_label,
            "key": credential.key,
            "value": credential.value,
            "created_at": credential.created_at,
            "updated_at": credential.updated_at,
        }
