"""
Controller for account management endpoints.
"""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.account_attributes_handler import (
    load_account_attributes,
    save_account_attributes,
    update_account_attributes,
)
from app.controllers.account_dates import update_account_dates
from app.controllers.account_events import create_account_event, list_account_events
from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.account import Account
from app.models.user_profile import UserProfile
from app.repositories.account_attribute_repository import AccountAttributeRepository
from app.repositories.account_repository import AccountRepository
from app.schemas.account import AccountCreate, AccountResponse, AccountUpdate
from app.schemas.account_event import AccountEventResponse
from app.services.account_service import AccountService

router = APIRouter(prefix="/accounts", tags=["accounts"])

# Register event handlers
router.add_api_route(
    "/{account_id}/events",
    list_account_events,
    methods=["GET"],
    response_model=list[AccountEventResponse],
)
router.add_api_route(
    "/{account_id}/events",
    create_account_event,
    methods=["POST"],
    response_model=AccountEventResponse,
    status_code=status.HTTP_201_CREATED,
)

# Register date handler
router.add_api_route("/{account_id}/dates", update_account_dates, methods=["PUT"])


@router.get("", response_model=list[AccountResponse])
async def list_accounts(
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[AccountResponse]:
    """List all accounts for the current user."""
    repo = AccountRepository(session)
    accounts = await repo.get_by_user(current_user.id)

    attr_repo = AccountAttributeRepository(session)
    responses = []
    for account in accounts:
        response = AccountResponse.from_orm(account)
        await load_account_attributes(
            attr_repo, account.id, current_user.id, response
        )
        responses.append(response)

    return responses


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> AccountResponse:
    """Get a specific account by ID."""
    repo = AccountRepository(session)
    account = await repo.get_by_id(account_id, current_user.id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    response = AccountResponse.from_orm(account)
    attr_repo = AccountAttributeRepository(session)
    await load_account_attributes(attr_repo, account_id, current_user.id, response)

    return response


@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    account_data: AccountCreate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> AccountResponse:
    """Create a new account for the current user."""
    account = Account()
    account.user_id = current_user.id
    account.institution_id = account_data.institution_id
    account.name = account_data.name
    account.type_id = account_data.type_id
    account.status_id = account_data.status_id
    session.add(account)
    try:
        await session.flush()
        await session.refresh(account)
    except Exception as e:
        error_msg = str(e).lower()
        if "foreign key" in error_msg or "constraint" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reference data",
            ) from e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create: {str(e)}",
        ) from e

    # Save banking details and interest rate if provided
    attr_repo = AccountAttributeRepository(session)
    await save_account_attributes(
        attr_repo, account.id, current_user.id, account_data
    )

    await session.commit()

    response = AccountResponse.from_orm(account)
    response.account_number = account_data.account_number
    response.sort_code = account_data.sort_code
    response.roll_ref_number = account_data.roll_ref_number
    response.interest_rate = account_data.interest_rate
    response.fixed_bonus_rate = account_data.fixed_bonus_rate
    response.fixed_bonus_rate_end_date = account_data.fixed_bonus_rate_end_date
    response.release_date = account_data.release_date
    response.number_of_shares = account_data.number_of_shares
    response.underlying = account_data.underlying
    response.price = account_data.price
    response.purchase_price = account_data.purchase_price
    return response


@router.put("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: int,
    account_data: AccountUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> AccountResponse:
    """Update an account."""
    print(f"[DEBUG] update_account called with account_id={account_id}")
    print(f"[DEBUG] account_data: {account_data}")
    print(f"[DEBUG] account_data.dict(): {account_data.dict()}")
    fbr = getattr(account_data, 'fixed_bonus_rate', 'NOT_FOUND')
    print(f"[DEBUG] fixedBonusRate={fbr}")
    fbre = getattr(account_data, 'fixed_bonus_rate_end_date', 'NOT_FOUND')
    print(f"[DEBUG] fixedBonusRateEndDate={fbre}")

    service = AccountService(session)
    update_dict: dict[str, Any] = {}
    if account_data.name is not None:
        update_dict["name"] = account_data.name
    if account_data.type_id is not None:
        update_dict["type_id"] = account_data.type_id
    if account_data.status_id is not None:
        update_dict["status_id"] = account_data.status_id

    try:
        await service.update(account_id, current_user.id, **update_dict)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

    # Update banking details and interest rate if provided
    attr_repo = AccountAttributeRepository(session)
    await update_account_attributes(attr_repo, account_id, current_user.id, account_data)

    await session.commit()

    repo = AccountRepository(session)
    account = await repo.get_by_id(account_id, current_user.id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    response = AccountResponse.from_orm(account)
    await load_account_attributes(attr_repo, account_id, current_user.id, response)

    return response


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> None:
    """Delete an account."""
    service = AccountService(session)
    try:
        await service.delete(account_id, current_user.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
