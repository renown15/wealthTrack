"""
Controller for account group management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.repositories.account_group_repository import AccountGroupRepository
from app.schemas.account_group import (
    AccountGroupCreate,
    AccountGroupResponse,
    AccountGroupUpdate,
)

router = APIRouter(prefix="/account-groups", tags=["account-groups"])


@router.get("", response_model=list[AccountGroupResponse])
async def list_account_groups(
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[AccountGroupResponse]:
    """List all account groups for the current user."""
    repo = AccountGroupRepository(session)
    groups = await repo.get_by_user(current_user.id)
    return [AccountGroupResponse.from_orm(g) for g in groups]


@router.get("/{group_id}", response_model=AccountGroupResponse)
async def get_account_group(
    group_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> AccountGroupResponse:
    """Get a specific account group by ID."""
    repo = AccountGroupRepository(session)
    group = await repo.get_by_id(group_id, current_user.id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account group not found",
        )
    return AccountGroupResponse.from_orm(group)


@router.get("/{group_id}/members", response_model=dict[str, list[int]])
async def get_group_members(
    group_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> dict[str, list[int]]:
    """Get all account IDs in a group."""
    repo = AccountGroupRepository(session)
    account_ids = await repo.get_group_members(group_id, current_user.id)
    return {"accountIds": account_ids}


@router.post("", response_model=AccountGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_account_group(
    group_data: AccountGroupCreate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> AccountGroupResponse:
    """Create a new account group."""
    repo = AccountGroupRepository(session)
    group = await repo.create(current_user.id, group_data.name)
    await session.commit()
    return AccountGroupResponse.from_orm(group)


@router.put("/{group_id}", response_model=AccountGroupResponse)
async def update_account_group(
    group_id: int,
    group_data: AccountGroupUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> AccountGroupResponse:
    """Update an account group."""
    repo = AccountGroupRepository(session)
    group = await repo.update(group_id, current_user.id, group_data.name)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account group not found",
        )
    await session.commit()
    return AccountGroupResponse.from_orm(group)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account_group(
    group_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> None:
    """Delete an account group."""
    repo = AccountGroupRepository(session)
    success = await repo.delete(group_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account group not found",
        )
    await session.commit()


@router.post("/{group_id}/members/{account_id}", status_code=status.HTTP_201_CREATED)
async def add_account_to_group(
    group_id: int,
    account_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> dict[str, str]:
    """Add an account to a group."""
    repo = AccountGroupRepository(session)
    member = await repo.add_member(group_id, current_user.id, account_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not add account to group",
        )
    await session.commit()
    return {"status": "success", "message": "Account added to group"}


@router.delete("/{group_id}/members/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_account_from_group(
    group_id: int,
    account_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> None:
    """Remove an account from a group."""
    repo = AccountGroupRepository(session)
    success = await repo.remove_member(group_id, current_user.id, account_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found in group",
        )
    await session.commit()
