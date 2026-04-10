"""Service for recording a share sale across three accounts atomically."""
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reference_data import ReferenceData
from app.repositories.account_attribute_repository import AccountAttributeRepository
from app.repositories.account_event_repository import AccountEventRepository
from app.repositories.account_repository import AccountRepository
from app.schemas.share_sale import ShareSaleRequest, ShareSaleResponse


async def _get_cgt_rate(session: AsyncSession) -> Decimal:
    """Read CGT rate (%) from ReferenceData where classkey='cgt_rate'."""
    stmt = select(ReferenceData.reference_value).where(
        ReferenceData.class_key == "cgt_rate",
    )
    result = await session.execute(stmt)
    rate_str = result.scalar_one_or_none()
    return Decimal(rate_str if rate_str is not None else "20")


async def execute_share_sale(
    request: ShareSaleRequest,
    user_id: int,
    session: AsyncSession,
) -> ShareSaleResponse:
    """Execute a share sale atomically across shares, cash, and tax liability accounts."""
    account_repo = AccountRepository(session)
    attr_repo = AccountAttributeRepository(session)
    event_repo = AccountEventRepository(session)

    # Verify user owns all three accounts
    shares_account = await account_repo.get_by_id(request.shares_account_id, user_id)
    cash_account = await account_repo.get_by_id(request.cash_account_id, user_id)
    tax_account = await account_repo.get_by_id(request.tax_liability_account_id, user_id)

    if not shares_account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shares account not found")
    if not cash_account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cash account not found")
    if not tax_account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tax liability account not found")

    # Read required attributes from shares account
    purchase_price_str = await attr_repo.get_attribute_by_name(
        request.shares_account_id, user_id, "purchase_price"
    )
    number_of_shares_str = await attr_repo.get_attribute_by_name(
        request.shares_account_id, user_id, "number_of_shares"
    )

    if not purchase_price_str:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Shares account has no purchase price set — cannot calculate CGT",
        )
    if not number_of_shares_str:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Shares account has no share count set",
        )

    # All monetary values in pence as Decimal for precision
    shares_sold = Decimal(request.shares_sold)
    sale_price_pence = Decimal(request.sale_price_per_share)
    purchase_price_pence = Decimal(purchase_price_str)
    current_shares = Decimal(number_of_shares_str)

    if shares_sold <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Shares sold must be greater than zero",
        )
    if shares_sold > current_shares:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Cannot sell {shares_sold} shares — only {current_shares} held",
        )

    # Calculate
    cgt_rate = await _get_cgt_rate(session)
    proceeds_pence = shares_sold * sale_price_pence
    proceeds_pounds = (proceeds_pence / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    gain_pence = (sale_price_pence - purchase_price_pence) * shares_sold
    gain_pounds = (gain_pence / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    cgt_pounds = (gain_pounds * cgt_rate / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    remaining_shares = current_shares - shares_sold

    # Write events and update attributes
    sale_type_id = await event_repo.get_event_type_id("Share Sale")
    deposit_type_id = await event_repo.get_event_type_id("Deposit")
    liability_type_id = await event_repo.get_event_type_id("Liability")

    if not sale_type_id or not deposit_type_id or not liability_type_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Required event types not found in reference data",
        )

    # 1. Share Sale event on shares account
    await event_repo.create_event(
        request.shares_account_id, user_id, sale_type_id, str(shares_sold)
    )

    # 2. Update number_of_shares attribute
    await attr_repo.set_attribute_by_name(
        request.shares_account_id, user_id, "number_of_shares", str(remaining_shares)
    )

    # 3. Deposit event on cash account (proceeds)
    await event_repo.create_event(
        request.cash_account_id, user_id, deposit_type_id, str(proceeds_pounds)
    )

    # 4. Liability event on tax account (CGT)
    await event_repo.create_event(
        request.tax_liability_account_id, user_id, liability_type_id, str(cgt_pounds)
    )

    # 5. Update encumbrance on tax liability account (cumulative CGT owed)
    existing_encumbrance_str = await attr_repo.get_attribute_by_name(
        request.tax_liability_account_id, user_id, "encumbrance"
    )
    existing_encumbrance = Decimal(existing_encumbrance_str or "0")
    new_encumbrance = (existing_encumbrance + cgt_pounds).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    await attr_repo.set_attribute_by_name(
        request.tax_liability_account_id, user_id, "encumbrance", str(new_encumbrance)
    )

    return ShareSaleResponse(
        shares_sold=str(shares_sold),
        sale_price_per_share=str(sale_price_pence),
        proceeds=str(proceeds_pounds),
        purchase_price_per_share=str(purchase_price_pence),
        cgt=str(cgt_pounds),
        remaining_shares=str(remaining_shares),
        cash_new_balance="",
        tax_liability_new_balance=str(new_encumbrance),
    )
