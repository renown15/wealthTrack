"""
Handlers for account event endpoints.
"""
from datetime import date as _date

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.account import Account
from app.models.user_profile import UserProfile
from app.repositories.account_attribute_repository import AccountAttributeRepository
from app.repositories.account_event_repository import AccountEventRepository
from app.repositories.account_repository import AccountRepository
from app.repositories.event_group_repository import EventGroupRepository
from app.schemas.account_event import AccountEventCreate, AccountEventResponse

_INTERNAL_EVENT_TYPES = {
    "Dividend Payment Date", "Gift Date", "Gift Donor", "Gift Shares", "Share Sale Date",
}


async def _verify_account_access(
    account_id: int,
    current_user: UserProfile,
    session: AsyncSession,
) -> Account:
    """Verify user has access to the specified account."""
    repo = AccountRepository(session)
    account = await repo.get_by_id(account_id, current_user.id)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account


async def list_account_events(
    account_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[AccountEventResponse]:
    """Return the event timeline for the requested account, including attributes."""
    await _verify_account_access(account_id, current_user, session)

    event_repo = AccountEventRepository(session)
    all_events = await event_repo.list_events(account_id, current_user.id)

    # Partition: internal events (used by groups) never shown in timeline
    visible_events = [e for e in all_events if e["event_type"] not in _INTERNAL_EVENT_TYPES]
    dividend_events = [e for e in visible_events if e["event_type"] == "Dividend"]

    # Enrich Dividend events with their explicit payment dates from the group
    payment_dates: dict[int, str] = {}
    if dividend_events:
        group_repo = EventGroupRepository(session)
        payment_dates = await group_repo.get_payment_dates_for_dividend_events(
            [e["id"] for e in dividend_events]
        )

    event_responses = []
    for event in visible_events:
        pd_str = payment_dates.get(event["id"]) if event["event_type"] == "Dividend" else None
        pd: _date | None = _date.fromisoformat(pd_str) if pd_str else None
        event_responses.append(AccountEventResponse(**event, source="event", payment_date=pd))

    attr_repo = AccountAttributeRepository(session)
    attributes = await attr_repo.get_all_attributes(account_id, current_user.id)
    attr_responses = [
        AccountEventResponse(
            id=attr["id"], account_id=attr["account_id"], user_id=current_user.id,
            event_type=attr["type_label"], value=attr["value"],
            created_at=attr["created_at"], updated_at=attr["updated_at"], source="attribute",
        )
        for attr in attributes
    ]

    combined = event_responses + attr_responses
    combined.sort(key=lambda x: x.created_at, reverse=True)
    return combined


async def create_account_event(
    account_id: int,
    event_data: AccountEventCreate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> AccountEventResponse:
    """Create a new event for the specified account."""
    await _verify_account_access(account_id, current_user, session)

    event_repo = AccountEventRepository(session)
    type_id = await event_repo.get_event_type_id(event_data.event_type)
    if not type_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown event type: {event_data.event_type}",
        )

    event = await event_repo.create_event(
        account_id=account_id, user_id=current_user.id, type_id=type_id, value=event_data.value,
    )
    return AccountEventResponse(
        id=event.id, account_id=event.account_id, user_id=event.user_id,
        event_type=event_data.event_type, value=event.value,
        created_at=event.created_at, updated_at=event.updated_at,
    )
