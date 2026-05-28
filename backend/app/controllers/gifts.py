"""Handlers for gift recording and IHT taper endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.schemas.gift import GiftSummary, RecordGiftRequest, RecordGiftResponse
from app.services.gift_service import delete_gift_by_event_id, get_user_gifts, record_gift

router = APIRouter(tags=["gifts"])


@router.post("/accounts/{account_id}/gifts", response_model=RecordGiftResponse)
async def create_gift(
    account_id: int,
    body: RecordGiftRequest,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> RecordGiftResponse:
    """Record a gift against an account."""
    try:
        return await record_gift(
            account_id=account_id,
            user_id=current_user.id,
            donor=body.donor,
            gift_date=body.gift_date,
            gift_value_gbp=body.gift_value_gbp,
            num_shares=body.num_shares,
            session=session,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@router.get("/gifts", response_model=list[GiftSummary])
async def list_gifts(
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[GiftSummary]:
    """Return all gifts for the current user with IHT taper calculations."""
    return await get_user_gifts(current_user.id, session)


@router.delete("/gifts/by-event/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_gift_by_event(
    event_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> None:
    """Delete a gift by its Gift event ID, reversing the balance contribution."""
    try:
        await delete_gift_by_event_id(event_id=event_id, user_id=current_user.id, session=session)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
