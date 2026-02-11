"""
Controller for institution credential management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.schemas.institution_security_credentials import (
    InstitutionSecurityCredentialCreate,
    InstitutionSecurityCredentialResponse,
    InstitutionSecurityCredentialUpdate,
)
from app.services.institution_security_credentials_service import (
    InstitutionSecurityCredentialsService,
)

router = APIRouter(
    prefix="/institutions/{institution_id}/credentials",
    tags=["institution-credentials"],
)


def _handle_service_error(exc: ValueError) -> HTTPException:
    detail = str(exc)
    if "not found" in detail.lower():
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


@router.get("", response_model=list[InstitutionSecurityCredentialResponse])
async def list_institution_credentials(
    institution_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[InstitutionSecurityCredentialResponse]:
    service = InstitutionSecurityCredentialsService(session)
    items = await service.list_for_institution(institution_id, current_user.id)
    return [
        InstitutionSecurityCredentialResponse(**item)
        for item in items
    ]


@router.post(
    "",
    response_model=InstitutionSecurityCredentialResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_institution_credential(
    institution_id: int,
    payload: InstitutionSecurityCredentialCreate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> InstitutionSecurityCredentialResponse:
    service = InstitutionSecurityCredentialsService(session)
    try:
        item = await service.create(institution_id, current_user.id, payload)
    except ValueError as exc:
        raise _handle_service_error(exc) from exc
    return InstitutionSecurityCredentialResponse(**item)


@router.put(
    "/{credential_id}",
    response_model=InstitutionSecurityCredentialResponse,
)
async def update_institution_credential(
    institution_id: int,
    credential_id: int,
    payload: InstitutionSecurityCredentialUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> InstitutionSecurityCredentialResponse:
    service = InstitutionSecurityCredentialsService(session)
    try:
        item = await service.update(institution_id, credential_id, current_user.id, payload)
    except ValueError as exc:
        raise _handle_service_error(exc) from exc
    return InstitutionSecurityCredentialResponse(**item)


@router.delete("/{credential_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_institution_credential(
    institution_id: int,
    credential_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> None:
    service = InstitutionSecurityCredentialsService(session)
    try:
        await service.delete(credential_id, current_user.id)
    except ValueError as exc:
        raise _handle_service_error(exc) from exc
    _ = institution_id
