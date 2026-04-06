"""
Controller handlers for tax return upsert.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.repositories.account_repository import AccountRepository
from app.repositories.tax_period_repository import TaxPeriodRepository
from app.repositories.tax_return_repository import TaxReturnRepository
from app.schemas.tax import TaxReturnResponse, TaxReturnUpsert

router = APIRouter()


@router.put(
    "/periods/{period_id}/accounts/{account_id}/return",
    response_model=TaxReturnResponse,
)
async def upsert_tax_return(
    period_id: int,
    account_id: int,
    data: TaxReturnUpsert,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> TaxReturnResponse:
    """Create or update tax return values for an account in a period."""
    period_repo = TaxPeriodRepository(session)
    period = await period_repo.get_by_id(period_id, current_user.id)
    if not period:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tax period not found"
        )

    account_repo = AccountRepository(session)
    account = await account_repo.get_by_id(account_id, current_user.id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
        )

    return_repo = TaxReturnRepository(session)
    tax_return = await return_repo.upsert(
        user_id=current_user.id,
        account_id=account_id,
        tax_period_id=period_id,
        income=data.income,
        capital_gain=data.capital_gain,
        tax_taken_off=data.tax_taken_off,
    )
    await session.commit()
    return TaxReturnResponse.model_validate(tax_return)
