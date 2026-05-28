"""Controller for family management and cross-member portfolio endpoints."""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.repositories.account_group_repository import AccountGroupRepository
from app.repositories.portfolio_repository import PortfolioRepository
from app.schemas.family import (
    AddMemberRequest,
    FamilyCreate,
    FamilyResponse,
    FamilyUpdate,
    UserSummaryResponse,
)
from app.services.family_service import FamilyService

router = APIRouter(prefix="/families", tags=["families"])


@router.get("", response_model=list[FamilyResponse])
async def list_families(
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[FamilyResponse]:
    return await FamilyService(session).get_families(current_user.id)


@router.post("", response_model=FamilyResponse, status_code=status.HTTP_201_CREATED)
async def create_family(
    body: FamilyCreate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> FamilyResponse:
    try:
        result = await FamilyService(session).create_family(body.name, current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    await session.commit()
    return result


@router.put("/{family_id}", response_model=FamilyResponse)
async def rename_family(
    family_id: int,
    body: FamilyUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> FamilyResponse:
    try:
        result = await FamilyService(session).rename_family(family_id, body.name, current_user.id)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family not found")
    await session.commit()
    return result


@router.delete("/{family_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_family(
    family_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> None:
    try:
        found = await FamilyService(session).delete_family(family_id, current_user.id)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family not found")
    await session.commit()


@router.get("/{family_id}/available-members", response_model=list[UserSummaryResponse])
async def get_available_members(
    family_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[UserSummaryResponse]:
    try:
        result = await FamilyService(session).get_available_members(family_id, current_user.id)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family not found")
    return result


@router.post("/{family_id}/members", response_model=FamilyResponse)
async def add_member(
    family_id: int,
    body: AddMemberRequest,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> FamilyResponse:
    try:
        result = await FamilyService(session).add_member(
            family_id, body.account_id, current_user.id
        )
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family not found")
    await session.commit()
    return result


@router.delete("/{family_id}/members/{member_id}", response_model=FamilyResponse)
async def remove_member(
    family_id: int,
    member_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> FamilyResponse:
    try:
        result = await FamilyService(session).remove_member(family_id, member_id, current_user.id)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family not found")
    await session.commit()
    return result


@router.get("/{family_id}/members/{member_id}/portfolio")
async def get_member_portfolio(
    family_id: int,
    member_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> dict[str, Any]:
    svc = FamilyService(session)
    if not await svc.verify_membership(family_id, member_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Both users must be members of this family",
        )
    repo = PortfolioRepository(session)
    items = await repo.get_user_portfolio(member_id)
    group_repo = AccountGroupRepository(session)
    groups = await group_repo.get_by_user(member_id)
    total_value = 0.0
    last_price_update = None
    for item in items:
        balance = item.get("latestBalance")
        if not balance:
            continue
        value = balance.get("value")
        if value is None:
            continue
        try:
            val = float(value)
            if item.get("accountType") == "Tax Liability":
                val = -val
            total_value += val
        except (TypeError, ValueError):
            continue
        balance_ts = balance.get("createdAt")
        if balance_ts:
            if last_price_update is None or balance_ts > last_price_update:
                last_price_update = balance_ts
    return {
        "items": items,
        "total_value": total_value,
        "account_count": len(items),
        "last_price_update": last_price_update,
        "groups": [
            {"id": g.id, "name": g.name, "userId": g.user_id,
             "createdAt": g.created_at.isoformat() if g.created_at else "",
             "updatedAt": g.updated_at.isoformat() if g.updated_at else ""}
            for g in groups
        ],
        "groupMembers": {g.id: [m.account_id for m in g.members] for g in groups},
    }
