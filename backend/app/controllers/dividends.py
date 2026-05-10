"""
Handlers for dividend recording endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.repositories.account_repository import AccountRepository
from app.schemas.dividend import RecordDividendRequest, RecordDividendResponse
from app.services.dividend_service import record_dividend

router = APIRouter(prefix="/accounts", tags=["dividends"])


@router.post("/{account_id}/dividends", response_model=RecordDividendResponse)
async def create_dividend(
    account_id: int,
    body: RecordDividendRequest,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> RecordDividendResponse:
    """Record a dividend payment against a Shares account."""
    repo = AccountRepository(session)
    account = await repo.get_by_id(account_id, current_user.id)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    try:
        return await record_dividend(
            account_id=account_id,
            user_id=current_user.id,
            amount=body.amount,
            payment_date=body.payment_date,
            session=session,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)) from e
