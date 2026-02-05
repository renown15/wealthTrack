"""
Controller for institution management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.institution import Institution
from app.models.user_profile import UserProfile
from app.repositories.institution_repository import InstitutionRepository
from app.schemas.institution import InstitutionCreate, InstitutionResponse, InstitutionUpdate
from app.services.institution_service import InstitutionService

router = APIRouter(prefix="/institutions", tags=["institutions"])


@router.get("", response_model=list[InstitutionResponse])
async def list_institutions(
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[InstitutionResponse]:
    """List all institutions for the current user."""
    repo = InstitutionRepository(session)
    institutions = await repo.get_by_user(current_user.id)
    return [InstitutionResponse.from_orm(inst) for inst in institutions]


@router.get("/{institution_id}", response_model=InstitutionResponse)
async def get_institution(
    institution_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> InstitutionResponse:
    """Get a specific institution by ID."""
    repo = InstitutionRepository(session)
    institution = await repo.get_by_id(institution_id, current_user.id)
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found",
        )
    return InstitutionResponse.from_orm(institution)


@router.post("", response_model=InstitutionResponse, status_code=status.HTTP_201_CREATED)
async def create_institution(
    institution_data: InstitutionCreate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> InstitutionResponse:
    """Create a new institution for the current user."""
    # Create institution (object instantiation, not model construction)
    institution = Institution()
    institution.userid = current_user.id
    institution.name = institution_data.name
    session.add(institution)
    await session.flush()
    await session.refresh(institution)
    return InstitutionResponse.from_orm(institution)


@router.put("/{institution_id}", response_model=InstitutionResponse)
async def update_institution(
    institution_id: int,
    inst_data: InstitutionUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> InstitutionResponse:
    """Update an institution."""
    service = InstitutionService(session)
    try:
        await service.update(institution_id, current_user.id, inst_data.name)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

    # Fetch updated institution
    repo = InstitutionRepository(session)
    institution = await repo.get_by_id(institution_id, current_user.id)
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found",
        )
    return InstitutionResponse.from_orm(institution)


@router.delete("/{institution_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_institution(
    institution_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> None:
    """Delete an institution."""
    service = InstitutionService(session)
    try:
        await service.delete(institution_id, current_user.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
