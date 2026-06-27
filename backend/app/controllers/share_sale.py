"""Controller for share sale endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.repositories.event_group_repository import EventGroupRepository
from app.schemas.share_sale import ShareSaleRequest, ShareSaleResponse, ShareSaleSummary
from app.services.share_sale_delete_service import delete_share_sale
from app.services.share_sale_service import execute_share_sale

router = APIRouter(tags=["share-sale"])


@router.post("/accounts/share-sale", response_model=ShareSaleResponse)
async def record_share_sale(
    request: ShareSaleRequest,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> ShareSaleResponse:
    """Record a share sale across shares, cash, and tax liability accounts."""
    return await execute_share_sale(request, current_user.id, session)


@router.get("/accounts/{account_id}/share-sales", response_model=list[ShareSaleSummary])
async def list_share_sales(
    account_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[ShareSaleSummary]:
    """Return all share sale groups associated with an account."""
    repo = EventGroupRepository(session)
    groups = await repo.get_groups_for_account(account_id, current_user.id, "Share Sale")
    return [ShareSaleSummary.from_group(g) for g in groups]


@router.delete("/accounts/share-sales/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def reverse_share_sale(
    group_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> None:
    """Reverse a recorded share sale: restore the share count and undo balances."""
    try:
        await delete_share_sale(group_id, current_user.id, session)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    await session.commit()
