"""Controller for share sale endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.schemas.share_sale import ShareSaleRequest, ShareSaleResponse
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
