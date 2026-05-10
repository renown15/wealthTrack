"""Tests for first_balance_date field in eligible account responses."""
from datetime import date, datetime

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.account_attribute import AccountAttribute
from app.models.account_event import AccountEvent
from app.models.reference_data import ReferenceData
from app.models.tax_period import TaxPeriod
from app.models.user_profile import UserProfile
from app.services.tax_service import get_eligible_with_returns

PERIOD_START = date(2024, 4, 6)
PERIOD_END = date(2025, 4, 5)


async def _ref_id(session: AsyncSession, class_key: str, value: str) -> int:
    row = (
        await session.execute(
            select(ReferenceData.id).where(
                ReferenceData.class_key == class_key,
                ReferenceData.reference_value == value,
            )
        )
    ).scalar_one_or_none()
    if row is not None:
        return row
    ref = ReferenceData(class_key=class_key, reference_value=value, sort_index=99)
    session.add(ref)
    await session.flush()
    await session.refresh(ref)
    return ref.id


async def _make_savings_account(session: AsyncSession, user: UserProfile) -> Account:
    type_id = await _ref_id(session, "account_type", "Savings Account")
    status_id = await _ref_id(session, "account_status", "Active")
    ir_attr_id = await _ref_id(session, "account_attribute_type", "Interest Rate")

    account = Account(user_id=user.id, name="Savings", type_id=type_id, status_id=status_id)
    session.add(account)
    await session.flush()

    session.add(
        AccountAttribute(user_id=user.id, account_id=account.id, type_id=ir_attr_id, value="2.5")
    )
    await session.flush()
    await session.refresh(account)
    return account


async def _make_period(session: AsyncSession, user: UserProfile) -> TaxPeriod:
    period = TaxPeriod()
    period.user_id = user.id
    period.name = "2024/25"
    period.start_date = PERIOD_START
    period.end_date = PERIOD_END
    period.created_at = period.updated_at = datetime.utcnow()
    session.add(period)
    await session.flush()
    await session.refresh(period)
    return period


async def _add_balance_event(
    session: AsyncSession, user: UserProfile, account: Account, event_date: datetime
) -> None:
    type_id = await _ref_id(session, "account_event_type", "Balance Update")
    event = AccountEvent(
        user_id=user.id,
        account_id=account.id,
        type_id=type_id,
        value="1000",
        created_at=event_date,
        updated_at=event_date,
    )
    session.add(event)
    await session.flush()


@pytest.mark.asyncio
async def test_first_balance_date_set_when_event_in_period(
    db_session: AsyncSession, user: UserProfile
) -> None:
    """first_balance_date reflects the earliest Balance Update event within the period."""
    account = await _make_savings_account(db_session, user)
    period = await _make_period(db_session, user)

    first_dt = datetime(2024, 7, 1, 10, 0, 0)
    second_dt = datetime(2024, 9, 15, 10, 0, 0)
    await _add_balance_event(db_session, user, account, second_dt)
    await _add_balance_event(db_session, user, account, first_dt)

    results = await get_eligible_with_returns(
        db_session, user.id, period.id, period.start_date, period.end_date
    )
    assert results["eligible"][0]["first_balance_date"] == date(2024, 7, 1)


@pytest.mark.asyncio
async def test_first_balance_date_none_when_no_event_in_period(
    db_session: AsyncSession, user: UserProfile
) -> None:
    """first_balance_date is None when there are no Balance Update events in the period."""
    account = await _make_savings_account(db_session, user)
    period = await _make_period(db_session, user)

    # Add a non-Balance-Update event — should not count
    interest_type_id = await _ref_id(db_session, "account_event_type", "Interest")
    db_session.add(
        AccountEvent(
            user_id=user.id, account_id=account.id, type_id=interest_type_id,
            value="5.00",
            created_at=datetime(2024, 8, 1), updated_at=datetime(2024, 8, 1),
        )
    )
    await db_session.flush()

    results = await get_eligible_with_returns(
        db_session, user.id, period.id, period.start_date, period.end_date
    )
    assert results["eligible"][0]["first_balance_date"] is None


@pytest.mark.asyncio
async def test_first_balance_date_ignores_events_outside_period(
    db_session: AsyncSession, user: UserProfile
) -> None:
    """Balance Update events outside the tax period window are excluded."""
    account = await _make_savings_account(db_session, user)
    period = await _make_period(db_session, user)

    before_period = datetime(2024, 1, 1, 10, 0, 0)
    after_period = datetime(2025, 6, 1, 10, 0, 0)
    await _add_balance_event(db_session, user, account, before_period)
    await _add_balance_event(db_session, user, account, after_period)

    results = await get_eligible_with_returns(
        db_session, user.id, period.id, period.start_date, period.end_date
    )
    assert results["eligible"][0]["first_balance_date"] is None
