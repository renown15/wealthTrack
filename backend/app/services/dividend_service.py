"""Service for recording dividend payments using AccountEventAttributeGroup."""
from datetime import date
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.reference_data import ReferenceData
from app.models.tax_period import TaxPeriod
from app.repositories.account_event_repository import AccountEventRepository
from app.repositories.event_group_repository import EventGroupRepository
from app.schemas.dividend import RecordDividendResponse

_DIVIDEND_TAX_RATE = Decimal("40")


async def _find_tax_account(
    session: AsyncSession, user_id: int, payment_date: date
) -> Optional[int]:
    """Find Tax Liability account whose name contains the TaxPeriod name covering payment_date."""
    period_row = (await session.execute(
        select(TaxPeriod.name)
        .where(TaxPeriod.user_id == user_id)
        .where(TaxPeriod.start_date <= payment_date)
        .where(TaxPeriod.end_date >= payment_date)
        .limit(1)
    )).scalar()
    if not period_row:
        return None

    type_id = (await session.execute(
        select(ReferenceData.id)
        .where(ReferenceData.class_key == "account_type")
        .where(ReferenceData.reference_value == "Tax Liability")
    )).scalar()
    if not type_id:
        return None

    return (await session.execute(
        select(Account.id)
        .where(Account.user_id == user_id)
        .where(Account.type_id == type_id)
        .where(Account.name.contains(period_row))
        .limit(1)
    )).scalar()


async def record_dividend(
    account_id: int,
    user_id: int,
    amount: str,
    payment_date: date,
    session: AsyncSession,
) -> RecordDividendResponse:
    """Record a dividend and auto-provision 40% tax to the matching Tax Liability account."""
    event_repo = AccountEventRepository(session)
    group_repo = EventGroupRepository(session)

    dividend_type_id = await event_repo.get_event_type_id("Dividend")
    date_type_id = await event_repo.get_event_type_id("Dividend Payment Date")
    if not dividend_type_id or not date_type_id:
        raise ValueError("Required event types not found in reference data")

    dividend_event = await event_repo.create_event(account_id, user_id, dividend_type_id, amount)
    date_event = await event_repo.create_event(
        account_id, user_id, date_type_id, payment_date.isoformat()
    )

    group = await group_repo.create_group(user_id, "Dividend")
    await group_repo.add_event_member(group.id, dividend_event.id)
    await group_repo.add_event_member(group.id, date_event.id)

    provision: Optional[Decimal] = None
    tax_account_id = await _find_tax_account(session, user_id, payment_date)
    if tax_account_id:
        provision = (Decimal(amount) * _DIVIDEND_TAX_RATE / 100).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        tax_type_id = await event_repo.get_event_type_id("Dividend Tax")
        balance_type_id = await event_repo.get_event_type_id("Balance Update")
        if tax_type_id and balance_type_id:
            current = Decimal(
                await event_repo.get_latest_balance_update(tax_account_id, user_id) or "0"
            )
            new_balance = (current + provision).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            tax_ev = await event_repo.create_event(
                tax_account_id, user_id, tax_type_id, str(provision)
            )
            bal_ev = await event_repo.create_event(
                tax_account_id, user_id, balance_type_id, str(new_balance)
            )
            await group_repo.add_event_member(group.id, tax_ev.id)
            await group_repo.add_event_member(group.id, bal_ev.id)

    return RecordDividendResponse(
        group_id=group.id,
        account_id=account_id,
        amount=amount,
        payment_date=payment_date,
        tax_provision=str(provision) if provision is not None else None,
        tax_account_id=tax_account_id,
    )
