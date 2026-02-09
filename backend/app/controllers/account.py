"""
Controller for account management endpoints.
"""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.account import Account
from app.models.user_profile import UserProfile
from app.repositories.account_repository import AccountRepository
from app.schemas.account import AccountCreate, AccountResponse, AccountUpdate
from app.services.account_service import AccountService

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=list[AccountResponse])
async def list_accounts(
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[AccountResponse]:
    """List all accounts for the current user."""
    repo = AccountRepository(session)
    accounts = await repo.get_by_user(current_user.id)
    return [AccountResponse.from_orm(account) for account in accounts]


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
    return AccountResponse.from_orm(account)


@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    account_data: AccountCreate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> AccountResponse:
    """Create a new account for the current user."""
    # Create account (object instantiation, not model construction)
    account = Account()
    account.user_id = current_user.id
    account.institution_id = account_data.institution_id
    account.name = account_data.name
    account.type_id = account_data.type_id
    account.status_id = account_data.status_id
    session.add(account)
    await session.flush()
    await session.refresh(account)
    return AccountResponse.from_orm(account)


@router.put("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: int,
    account_data: AccountUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> AccountResponse:
    """Update an account."""
    service = AccountService(session)
    update_dict: dict[str, Any] = {}
    if account_data.name is not None:
        update_dict["name"] = account_data.name
    if account_data.type_id is not None:
        update_dict["typeid"] = account_data.type_id
    if account_data.status_id is not None:
        update_dict["statusid"] = account_data.status_id

    try:
        await service.update(account_id, current_user.id, **update_dict)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

    # Fetch updated account
    repo = AccountRepository(session)
    account = await repo.get_by_id(account_id, current_user.id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )
    return AccountResponse.from_orm(account)


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
