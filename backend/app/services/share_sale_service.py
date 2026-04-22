"""Service for recording a share sale across three accounts atomically."""
from decimal import ROUND_HALF_UP, Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reference_data import ReferenceData
from app.repositories.account_attribute_repository import AccountAttributeRepository
from app.repositories.account_event_repository import AccountEventRepository
from app.repositories.account_repository import AccountRepository
from app.repositories.event_group_repository import EventGroupRepository
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
    group_repo = EventGroupRepository(session)

    # Verify user owns all three accounts
    shares_account = await account_repo.get_by_id(request.shares_account_id, user_id)
    cash_account = await account_repo.get_by_id(request.cash_account_id, user_id)
    tax_account = await account_repo.get_by_id(request.tax_liability_account_id, user_id)

    if not shares_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shares account not found"
        )
    if not cash_account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cash account not found")
    if not tax_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tax liability account not found"
        )

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

    # Calculations (values in pence, then converted to pounds where needed)
    cgt_rate = await _get_cgt_rate(session)
    proceeds_pence = shares_sold * sale_price_pence
    proceeds_pounds = (proceeds_pence / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    gain_pence = (sale_price_pence - purchase_price_pence) * shares_sold
    gain_pounds = (gain_pence / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    cgt_pounds = (gain_pounds * cgt_rate / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    remaining_shares = current_shares - shares_sold
    shares_remaining_value = (remaining_shares * sale_price_pence / 100).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )

    # Resolve event type IDs
    sale_type_id = await event_repo.get_event_type_id("Share Sale")
    balance_type_id = await event_repo.get_event_type_id("Balance Update")
    deposit_type_id = await event_repo.get_event_type_id("Deposit")
    cgt_type_id = await event_repo.get_event_type_id("Capital Gains Tax")

    if sale_type_id is None or balance_type_id is None \
            or deposit_type_id is None or cgt_type_id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Required event types not found in reference data",
        )

    # Read current balances before writing new ones
    current_cash_balance = Decimal(
        await event_repo.get_latest_balance_update(request.cash_account_id, user_id) or "0"
    )
    current_tax_balance = Decimal(
        await event_repo.get_latest_balance_update(request.tax_liability_account_id, user_id) or "0"
    )
    new_cash_balance = (current_cash_balance + proceeds_pounds).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    new_tax_balance = (current_tax_balance + cgt_pounds).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )

    # Write events in logical transaction order
    # 1. Share Sale event on shares account (count of shares sold)
    sale_event = await event_repo.create_event(
        request.shares_account_id,
        user_id,
        sale_type_id,
        str(shares_sold),    )
    # 2. Update number_of_shares attribute
    updated_attr = await attr_repo.set_attribute_by_name(
        request.shares_account_id, user_id, "number_of_shares", str(remaining_shares)
    )
    # 3. Balance Update on shares account (remaining value in £)
    shares_balance_event = await event_repo.create_event(
        request.shares_account_id,
        user_id,
        balance_type_id,
        str(shares_remaining_value),    )
    # 4. Deposit event on cash account (proceeds in £)
    deposit_event = await event_repo.create_event(
        request.cash_account_id,
        user_id,
        deposit_type_id,
        str(proceeds_pounds),    )
    # 5. Balance Update on cash account (new running total)
    cash_balance_event = await event_repo.create_event(
        request.cash_account_id,
        user_id,
        balance_type_id,
        str(new_cash_balance),    )
    # 6. Capital Gains Tax event on tax account (CGT owed)
    liability_event = await event_repo.create_event(
        request.tax_liability_account_id,
        user_id,
        cgt_type_id,
        str(cgt_pounds),    )
    # 7. Balance Update on tax account (cumulative CGT owed)
    tax_balance_event = await event_repo.create_event(
        request.tax_liability_account_id,
        user_id,
        balance_type_id,
        str(new_tax_balance),    )

    # 8. Store sale metadata as per-sale attributes on the shares account
    sale_price_attr = await attr_repo.set_attribute_by_name(
        request.shares_account_id, user_id, "sale_price_per_share", str(sale_price_pence)
    )
    purchase_price_attr = await attr_repo.set_attribute_by_name(
        request.shares_account_id, user_id, "purchase_price_per_share", str(purchase_price_pence)
    )
    capital_gain_attr = await attr_repo.set_attribute_by_name(
        request.shares_account_id, user_id, "capital_gain", str(gain_pounds)
    )
    cgt_rate_attr = await attr_repo.set_attribute_by_name(
        request.shares_account_id, user_id, "cgt_rate", str(cgt_rate)
    )

    # 9. Create event group linking all written records
    group = await group_repo.create_group(user_id, "Share Sale")
    await group_repo.add_event_member(group.id, sale_event.id)
    if updated_attr:
        await group_repo.add_attribute_member(group.id, updated_attr.id)
    await group_repo.add_event_member(group.id, shares_balance_event.id)
    await group_repo.add_event_member(group.id, deposit_event.id)
    await group_repo.add_event_member(group.id, cash_balance_event.id)
    await group_repo.add_event_member(group.id, liability_event.id)
    await group_repo.add_event_member(group.id, tax_balance_event.id)
    if sale_price_attr:
        await group_repo.add_attribute_member(group.id, sale_price_attr.id)
    if purchase_price_attr:
        await group_repo.add_attribute_member(group.id, purchase_price_attr.id)
    if capital_gain_attr:
        await group_repo.add_attribute_member(group.id, capital_gain_attr.id)
    if cgt_rate_attr:
        await group_repo.add_attribute_member(group.id, cgt_rate_attr.id)

    return ShareSaleResponse(
        shares_sold=str(shares_sold),
        sale_price_per_share=str(sale_price_pence),
        proceeds=str(proceeds_pounds),
        purchase_price_per_share=str(purchase_price_pence),
        capital_gain=str(gain_pounds),
        cgt_rate=str(cgt_rate),
        cgt=str(cgt_pounds),
        remaining_shares=str(remaining_shares),
        cash_new_balance=str(new_cash_balance),
        tax_liability_new_balance=str(new_tax_balance),
    )
