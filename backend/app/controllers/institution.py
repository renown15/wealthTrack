"""
Controller for institution management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.institution import Institution
from app.models.user_profile import UserProfile
from app.repositories.institution_group_repository import InstitutionGroupRepository
from app.repositories.institution_repository import InstitutionRepository
from app.schemas.institution import InstitutionCreate, InstitutionResponse, InstitutionUpdate
from app.services.institution_service import InstitutionService

router = APIRouter(prefix="/institutions", tags=["institutions"])


async def _enrich_institution_response(
    response: InstitutionResponse,
    institution_id: int,
    current_user_id: int,
    group_repo: InstitutionGroupRepository,
) -> None:
    """Load parent institution relationship if exists."""
    parent_group = await group_repo.get_parent_for_child(
        institution_id, current_user_id
    )
    if parent_group:
        response.parent_id = parent_group.parent_institution_id


@router.get("", response_model=list[InstitutionResponse])
async def list_institutions(
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[InstitutionResponse]:
    """List all institutions for the current user."""
    repo = InstitutionRepository(session)
    group_repo = InstitutionGroupRepository(session)
    institutions = await repo.get_by_user(current_user.id)

    responses = []
    for inst in institutions:
        response = InstitutionResponse.from_orm(inst)
        await _enrich_institution_response(response, inst.id, current_user.id, group_repo)
        responses.append(response)

    return responses


@router.get("/{institution_id}", response_model=InstitutionResponse)
async def get_institution(
    institution_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> InstitutionResponse:
    """Get a specific institution by ID."""
    repo = InstitutionRepository(session)
    group_repo = InstitutionGroupRepository(session)
    institution = await repo.get_by_id(institution_id, current_user.id)
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found",
        )
    response = InstitutionResponse.from_orm(institution)
    await _enrich_institution_response(response, institution_id, current_user.id, group_repo)
    return response


@router.post("", response_model=InstitutionResponse, status_code=status.HTTP_201_CREATED)
async def create_institution(
    institution_data: InstitutionCreate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> InstitutionResponse:
    """Create a new institution for the current user."""
    # Create institution (object instantiation, not model construction)
    institution = Institution()
    institution.user_id = current_user.id
    institution.name = institution_data.name
    institution.institution_type = institution_data.institution_type
    session.add(institution)
    try:
        await session.flush()
        await session.refresh(institution)
    except Exception as e:
        error_msg = str(e).lower()
        if "unique" in error_msg or "duplicate" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Institution already exists",
            ) from e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create: {str(e)}",
        ) from e

    # Set parent if provided
    group_repo = InstitutionGroupRepository(session)
    if institution_data.parent_id:
        await group_repo.set_parent(institution.id, institution_data.parent_id, current_user.id)

    await session.commit()

    response = InstitutionResponse.from_orm(institution)
    if institution_data.parent_id:
        response.parent_id = institution_data.parent_id
    return response


@router.put("/{institution_id}", response_model=InstitutionResponse)
async def update_institution(
    institution_id: int,
    inst_data: InstitutionUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> InstitutionResponse:
    """Update an institution."""
    repo = InstitutionRepository(session)
    institution = await repo.get_by_id(institution_id, current_user.id)
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found",
        )

    # Update basic fields
    if inst_data.name is not None:
        institution.name = inst_data.name

    if inst_data.institution_type is not None:
        institution.institution_type = inst_data.institution_type

    # Handle parent institution changes
    group_repo = InstitutionGroupRepository(session)
    if inst_data.parent_id is not None:
        await group_repo.set_parent(institution_id, inst_data.parent_id, current_user.id)

    await session.commit()

    # Fetch updated institution
    institution = await repo.get_by_id(institution_id, current_user.id)
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found",
        )
    response = InstitutionResponse.from_orm(institution)
    await _enrich_institution_response(response, institution_id, current_user.id, group_repo)
    return response


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
