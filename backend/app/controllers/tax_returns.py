"""
Controller handlers for tax return upsert.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.repositories.account_attribute_repository import AccountAttributeRepository
from app.repositories.account_repository import AccountRepository
from app.repositories.tax_period_repository import TaxPeriodRepository
from app.repositories.tax_return_repository import TaxReturnRepository
from app.schemas.tax import TaxReturnResponse, TaxReturnUpsert, TaxScopeUpdate
from app.services.tax_scope_helpers import get_scope_maps

router = APIRouter()


def _scope_response(tax_return: object, by_id: dict[int, str]) -> TaxReturnResponse:
    """Build a TaxReturnResponse, resolving scope_status_id to its reference value."""
    response = TaxReturnResponse.model_validate(tax_return)
    status_id = getattr(tax_return, "scope_status_id", None)
    response.scope = by_id.get(status_id) if status_id is not None else None
    return response


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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tax period not found")

    account_repo = AccountRepository(session)
    account = await account_repo.get_by_id(account_id, current_user.id)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    return_repo = TaxReturnRepository(session)
    tax_return = await return_repo.upsert(
        user_id=current_user.id,
        account_id=account_id,
        tax_period_id=period_id,
        income=data.income,
        capital_gain=data.capital_gain,
        tax_taken_off=data.tax_taken_off,
    )
    if data.comment is not None:
        await AccountAttributeRepository(session).set_attribute_by_name(
            account_id, current_user.id, "notes", data.comment
        )
    await session.commit()
    by_id, _ = await get_scope_maps(session)
    return _scope_response(tax_return, by_id)


@router.put(
    "/periods/{period_id}/accounts/{account_id}/scope",
    response_model=TaxReturnResponse,
)
async def set_tax_scope(
    period_id: int,
    account_id: int,
    data: TaxScopeUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> TaxReturnResponse:
    """Set or clear an account's scope override and note for a period."""
    period = await TaxPeriodRepository(session).get_by_id(period_id, current_user.id)
    if not period:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tax period not found")
    account = await AccountRepository(session).get_by_id(account_id, current_user.id)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    by_id, by_value = await get_scope_maps(session)
    scope_status_id: int | None = None
    if data.scope is not None:
        scope_status_id = by_value.get(data.scope)
        if scope_status_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown tax scope status: {data.scope}",
            )

    tax_return = await TaxReturnRepository(session).set_scope(
        current_user.id, account_id, period_id, scope_status_id, data.note
    )
    await session.commit()
    return _scope_response(tax_return, by_id)
