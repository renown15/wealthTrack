"""
Controller handlers for tax period management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.repositories.tax_period_repository import TaxPeriodRepository
from app.schemas.tax import TaxPeriodCreate, TaxPeriodResponse
from app.services.tax_service import get_eligible_with_returns
from app.schemas.tax import EligibleAccountResponse, TaxReturnResponse, TaxDocumentResponse

router = APIRouter()


@router.get("/periods", response_model=list[TaxPeriodResponse])
async def list_tax_periods(
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[TaxPeriodResponse]:
    """List all tax periods for the current user."""
    repo = TaxPeriodRepository(session)
    periods = await repo.list_for_user(current_user.id)
    return [TaxPeriodResponse.model_validate(p) for p in periods]


@router.post("/periods", response_model=TaxPeriodResponse, status_code=status.HTTP_201_CREATED)
async def create_tax_period(
    data: TaxPeriodCreate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> TaxPeriodResponse:
    """Create a new tax period."""
    if data.end_date <= data.start_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="end_date must be after start_date",
        )
    repo = TaxPeriodRepository(session)
    period = await repo.create(current_user.id, data.name, data.start_date, data.end_date)
    await session.commit()
    return TaxPeriodResponse.model_validate(period)


@router.delete("/periods/{period_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tax_period(
    period_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> None:
    """Delete a tax period and all associated returns and documents."""
    repo = TaxPeriodRepository(session)
    period = await repo.get_by_id(period_id, current_user.id)
    if not period:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tax period not found")
    await repo.delete(period)
    await session.commit()


@router.get("/periods/{period_id}/accounts", response_model=list[EligibleAccountResponse])
async def get_eligible_accounts(
    period_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[EligibleAccountResponse]:
    """Get eligible accounts for a tax period with their return data."""
    repo = TaxPeriodRepository(session)
    period = await repo.get_by_id(period_id, current_user.id)
    if not period:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tax period not found")

    items = await get_eligible_with_returns(
        session, current_user.id, period_id, period.start_date, period.end_date
    )

    return [
        EligibleAccountResponse(
            account_id=item["account"].id,
            account_name=item["account"].name,
            account_type=item["account_type"],
            institution_name=item["account"].institution.name if item["account"].institution else None,
            interest_rate=item.get("interest_rate"),
            account_status=item.get("account_status"),
            account_number=item.get("attrs", {}).get("Account Number"),
            sort_code=item.get("attrs", {}).get("Sort Code"),
            roll_ref_number=item.get("attrs", {}).get("Roll / Ref Number"),
            eligibility_reason=item["eligibility_reason"],
            event_count=item.get("event_count", 0),
            tax_return=TaxReturnResponse.model_validate(item["tax_return"]) if item["tax_return"] else None,
            documents=[TaxDocumentResponse.model_validate(d) for d in item["documents"]],
        )
        for item in items
    ]
