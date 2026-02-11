"""
Handlers for account event endpoints.
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.repositories.account_event_repository import AccountEventRepository
from app.repositories.account_repository import AccountRepository
from app.schemas.account_event import AccountEventCreate, AccountEventResponse


async def list_account_events(
    account_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[AccountEventResponse]:
    """Return the event timeline for the requested account."""
    account_repo = AccountRepository(session)
    account = await account_repo.get_by_id(account_id, current_user.id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    event_repo = AccountEventRepository(session)
    events = await event_repo.list_events(account_id, current_user.id)
    return [AccountEventResponse(**event) for event in events]


async def create_account_event(
    account_id: int,
    event_data: AccountEventCreate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> AccountEventResponse:
    """Create a new event for the specified account."""
    account_repo = AccountRepository(session)
    account = await account_repo.get_by_id(account_id, current_user.id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    event_repo = AccountEventRepository(session)
    type_id = await event_repo.get_event_type_id(event_data.event_type)
    if not type_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown event type: {event_data.event_type}",
        )

    event = await event_repo.create_event(
        account_id=account_id,
        user_id=current_user.id,
        type_id=type_id,
        value=event_data.value,
    )
    return AccountEventResponse(
        id=event.id,
        account_id=event.account_id,
        user_id=event.user_id,
        event_type=event_data.event_type,
        value=event.value,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )
