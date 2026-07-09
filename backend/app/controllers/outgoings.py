"""Handlers for outgoing actual-cost and projection endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.schemas.outgoing import ActualCostCreate, ActualCostItem, OutgoingProjection
from app.services.outgoing_cost_service import (
    delete_actual_cost,
    get_projections,
    list_actual_costs,
    record_actual_cost,
)

router = APIRouter(tags=["outgoings"])


@router.post(
    "/accounts/{account_id}/actual-costs",
    response_model=ActualCostItem,
    status_code=status.HTTP_201_CREATED,
)
async def create_actual_cost(
    account_id: int,
    body: ActualCostCreate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> ActualCostItem:
    """Record a historic actual cost against an outgoing account."""
    try:
        return await record_actual_cost(
            account_id=account_id,
            user_id=current_user.id,
            amount=body.amount,
            cost_date=body.cost_date,
            session=session,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@router.get("/accounts/{account_id}/actual-costs", response_model=list[ActualCostItem])
async def get_actual_costs(
    account_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[ActualCostItem]:
    """List recorded actual costs for an account, newest period first."""
    return await list_actual_costs(account_id, current_user.id, session)


@router.delete("/outgoings/actual-costs/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_actual_cost(
    group_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> None:
    """Delete a recorded actual cost (the whole event group)."""
    try:
        await delete_actual_cost(group_id=group_id, user_id=current_user.id, session=session)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@router.get("/outgoings/projections", response_model=list[OutgoingProjection])
async def get_outgoing_projections(
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[OutgoingProjection]:
    """Projected per-period cost per account, derived from actual-cost history."""
    return await get_projections(current_user.id, session)
