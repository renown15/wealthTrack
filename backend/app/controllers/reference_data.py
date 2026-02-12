"""Controller that exposes reference-data lookup rows."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.reference_data import ReferenceData
from app.models.account import Account
from app.models.account_event import AccountEvent
from app.models.account_attribute import AccountAttribute
from app.models.institution_security_credentials import InstitutionSecurityCredentials
from app.models.user_profile import UserProfile
from app.schemas.reference_data import ReferenceDataCreate, ReferenceDataResponse
from app.services.reference_data import list_reference_data_by_class

router = APIRouter(prefix="/reference-data", tags=["reference-data"])


async def get_reference_usage(session: AsyncSession, ref_id: int) -> list[str]:
    """Check what's using a reference data item."""
    usage = []

    # Check accounts (type_id and status_id)
    acc_type = await session.scalar(
        select(func.count()).select_from(Account).where(Account.type_id == ref_id)
    )
    if acc_type:
        usage.append(f"{acc_type} account(s) use this as type")

    acc_status = await session.scalar(
        select(func.count()).select_from(Account).where(Account.status_id == ref_id)
    )
    if acc_status:
        usage.append(f"{acc_status} account(s) use this as status")

    # Check account events
    evt_count = await session.scalar(
        select(func.count()).select_from(AccountEvent).where(AccountEvent.type_id == ref_id)
    )
    if evt_count:
        usage.append(f"{evt_count} account event(s)")

    # Check account attributes
    attr_count = await session.scalar(
        select(func.count()).select_from(AccountAttribute).where(AccountAttribute.type_id == ref_id)
    )
    if attr_count:
        usage.append(f"{attr_count} account attribute(s)")

    # Check credentials
    cred_count = await session.scalar(
        select(func.count()).select_from(InstitutionSecurityCredentials)
        .where(InstitutionSecurityCredentials.type_id == ref_id)
    )
    if cred_count:
        usage.append(f"{cred_count} credential(s)")

    # Check user profiles
    user_count = await session.scalar(
        select(func.count()).select_from(UserProfile).where(UserProfile.type_id == ref_id)
    )
    if user_count:
        usage.append(f"{user_count} user profile(s)")

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
    from sqlalchemy import select
    result = await session.execute(
        select(ReferenceData).order_by(ReferenceData.sort_index, ReferenceData.class_key, ReferenceData.reference_value)
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
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Entry already exists") from e
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to create: {str(e)}") from e
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
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Entry already exists") from e
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to update: {str(e)}") from e
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
