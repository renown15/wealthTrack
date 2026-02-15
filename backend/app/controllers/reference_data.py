"""Controller that exposes reference-data lookup rows."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.account import Account
from app.models.account_attribute import AccountAttribute
from app.models.account_event import AccountEvent
from app.models.institution_security_credentials import InstitutionSecurityCredentials
from app.models.reference_data import ReferenceData
from app.models.user_profile import UserProfile
from app.schemas.reference_data import ReferenceDataCreate, ReferenceDataResponse
from app.services.reference_data import list_reference_data_by_class

router = APIRouter(prefix="/reference-data", tags=["reference-data"])

# Usage check configuration: (model, foreign_key_field, label)
USAGE_CHECKS = [
    (Account, Account.type_id, "account(s) use this as type"),
    (Account, Account.status_id, "account(s) use this as status"),
    (AccountEvent, AccountEvent.type_id, "account event(s)"),
    (AccountAttribute, AccountAttribute.type_id, "account attribute(s)"),
    (InstitutionSecurityCredentials, InstitutionSecurityCredentials.type_id, "credential(s)"),
    (UserProfile, UserProfile.type_id, "user profile(s)"),
]


async def get_reference_usage(session: AsyncSession, ref_id: int) -> list[str]:
    """Check what's using a reference data item."""
    usage = []

    for model, field, label in USAGE_CHECKS:
        count = await session.scalar(
            select(func.count()).select_from(model).where(field == ref_id)  # pylint: disable=not-callable
        )
        if count:
            usage.append(f"{count} {label}")

    return usage


@router.get("/{class_key}", response_model=list[ReferenceDataResponse])
async def list_reference_data(
    class_key: str,
    session: AsyncSession = Depends(get_db),
) -> list[ReferenceDataResponse]:
    """Return all lookup rows for the requested reference-data class."""
    entries = await list_reference_data_by_class(session, class_key)
    return [ReferenceDataResponse.from_orm(entry) for entry in entries]


@router.get("", response_model=list[ReferenceDataResponse])
async def list_all_reference_data(
    session: AsyncSession = Depends(get_db),
) -> list[ReferenceDataResponse]:
    """Return all reference data entries for admin management."""
    result = await session.execute(
        select(ReferenceData).order_by(
            ReferenceData.sort_index, ReferenceData.class_key, ReferenceData.reference_value
        )
    )
    entries = result.scalars().all()
    return [ReferenceDataResponse.from_orm(entry) for entry in entries]


@router.post("", response_model=ReferenceDataResponse, status_code=status.HTTP_201_CREATED)
async def create_reference_data(
    payload: ReferenceDataCreate,
    session: AsyncSession = Depends(get_db),
) -> ReferenceDataResponse:
    """Create a new reference data entry."""
    entry = ReferenceData(  # type: ignore
        class_key=payload.class_key,
        reference_value=payload.reference_value,
        sort_index=payload.sort_index or 0,
    )
    session.add(entry)
    try:
        await session.flush()
        await session.refresh(entry)
    except Exception as e:
        error_msg = str(e).lower()
        if "unique" in error_msg or "duplicate" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Entry already exists",
            ) from e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create: {str(e)}",
        ) from e
    return ReferenceDataResponse.from_orm(entry)


@router.put("/{reference_id}", response_model=ReferenceDataResponse)
async def update_reference_data(
    reference_id: int,
    payload: ReferenceDataCreate,
    session: AsyncSession = Depends(get_db),
) -> ReferenceDataResponse:
    """Update an existing reference data entry."""
    entry = await session.get(ReferenceData, reference_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reference data {reference_id} not found",
        )

    entry.class_key = payload.class_key
    entry.reference_value = payload.reference_value
    if payload.sort_index is not None:
        entry.sort_index = payload.sort_index

    session.add(entry)
    try:
        await session.flush()
        await session.refresh(entry)
    except Exception as e:
        error_msg = str(e).lower()
        if "unique" in error_msg or "duplicate" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Entry already exists",
            ) from e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update: {str(e)}",
        ) from e
    return ReferenceDataResponse.from_orm(entry)


@router.delete("/{reference_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reference_data(
    reference_id: int,
    session: AsyncSession = Depends(get_db),
) -> None:
    """Delete a reference data entry."""
    entry = await session.get(ReferenceData, reference_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reference data {reference_id} not found",
        )

    # Check what's using this item before attempting delete
    usage = await get_reference_usage(session, reference_id)
    if usage:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete: used by {', '.join(usage)}",
        )

    try:
        await session.execute(delete(ReferenceData).where(ReferenceData.id == reference_id))
        await session.commit()
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete: {str(e)}",
        ) from e
