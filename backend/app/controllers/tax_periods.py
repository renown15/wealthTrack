"""
Controller handlers for tax period management.
"""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.repositories.account_group_repository import AccountGroupRepository
from app.repositories.family_repository import FamilyRepository
from app.repositories.tax_period_repository import TaxPeriodRepository
from app.schemas.tax import (
    EligibleAccountResponse,
    TaxDocumentResponse,
    TaxPeriodAccountsResponse,
    TaxPeriodCreate,
    TaxPeriodResponse,
    TaxPeriodUpdate,
    TaxReturnResponse,
)
from app.services.tax_service import get_eligible_with_returns

router = APIRouter()


@router.get("/periods", response_model=list[TaxPeriodResponse])
async def list_tax_periods(
    member_id: int | None = None,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[TaxPeriodResponse]:
    """List tax periods for the current user, or a family member when member_id is given."""
    target_id = current_user.id
    if member_id is not None and member_id != current_user.id:
        member_ids = await FamilyRepository(session).get_member_ids_for_user(current_user.id)
        if member_id not in member_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You may not view this member's tax periods",
            )
        target_id = member_id
    repo = TaxPeriodRepository(session)
    periods = await repo.list_for_user(target_id)
    return [TaxPeriodResponse.model_validate(p) for p in periods]


@router.post("/periods", response_model=TaxPeriodResponse, status_code=status.HTTP_201_CREATED)
async def create_tax_period(
    data: TaxPeriodCreate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> TaxPeriodResponse:
    """Create a new tax period with a linked account group."""
    group_repo = AccountGroupRepository(session)
    group = await group_repo.create(current_user.id, f"Tax Period: {data.name}")

    period_repo = TaxPeriodRepository(session)
    period = await period_repo.create(
        current_user.id,
        data.name,
        data.start_date,
        data.end_date,
        account_group_id=group.id,
    )
    await session.commit()
    return TaxPeriodResponse.model_validate(period)


@router.patch("/periods/{period_id}", response_model=TaxPeriodResponse)
async def update_tax_period(
    period_id: int,
    data: TaxPeriodUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> TaxPeriodResponse:
    """Update editable fields on a tax period (the commentary)."""
    repo = TaxPeriodRepository(session)
    period = await repo.get_by_id(period_id, current_user.id)
    if not period:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tax period not found")
    period.commentary = data.commentary
    await session.commit()
    await session.refresh(period)
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


def _tax_return_response(item: dict[str, Any]) -> TaxReturnResponse | None:
    """Build the tax return response, resolving the scope override value."""
    tax_return = item.get("tax_return")
    if not tax_return:
        return None
    response = TaxReturnResponse.model_validate(tax_return)
    response.scope = item.get("scope")
    return response


def _build_account_response(item: dict[str, Any]) -> EligibleAccountResponse:
    return EligibleAccountResponse(
        account_id=item["account"].id,
        account_name=item["account"].name,
        account_type=item["account_type"],
        institution_name=(
            item["account"].institution.name if item["account"].institution else None
        ),
        interest_rate=item.get("interest_rate") or item.get("attrs", {}).get("Interest Rate"),
        account_status=item.get("account_status"),
        account_number=item.get("attrs", {}).get("Account Number"),
        sort_code=item.get("attrs", {}).get("Sort Code"),
        roll_ref_number=item.get("attrs", {}).get("Roll / Ref Number"),
        eligibility_reason=item["eligibility_reason"],
        event_count=item.get("event_count", 0),
        first_balance_date=item.get("first_balance_date"),
        comment=item.get("attrs", {}).get("Notes"),
        tax_return=_tax_return_response(item),
        documents=[TaxDocumentResponse.model_validate(d) for d in item["documents"]],
    )


@router.get("/periods/{period_id}/accounts", response_model=TaxPeriodAccountsResponse)
async def get_eligible_accounts(
    period_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> TaxPeriodAccountsResponse:
    """Get accounts for a tax period split into in-scope and eligible sections."""
    repo = TaxPeriodRepository(session)
    period = await repo.get_by_id(period_id, current_user.id)
    if not period:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tax period not found")

    if not period.account_group_id:
        group_repo = AccountGroupRepository(session)
        group = await group_repo.create(current_user.id, f"Tax Period: {period.name}")
        period.account_group_id = group.id
        await session.flush()
        await session.commit()

    result = await get_eligible_with_returns(
        session,
        current_user.id,
        period_id,
        period.start_date,
        period.end_date,
        group_id=period.account_group_id,
        period_name=period.name,
    )

    return TaxPeriodAccountsResponse(
        account_group_id=period.account_group_id,
        in_scope=[_build_account_response(item) for item in result["in_scope"]],
        eligible=[_build_account_response(item) for item in result["eligible"]],
        tax_free=[_build_account_response(item) for item in result["tax_free"]],
        not_in_scope=[_build_account_response(item) for item in result["not_in_scope"]],
    )
