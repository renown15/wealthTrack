"""Tests for tax service — eligible account logic."""
from datetime import date, datetime

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.account_attribute import AccountAttribute
from app.models.reference_data import ReferenceData
from app.models.tax_period import TaxPeriod
from app.models.user_profile import UserProfile
from app.services.tax_service import (
    _parse_date,
    _savings_eligible,
    _shares_sold_eligible,
    get_eligible_with_returns,
)

# ── Pure function unit tests ─────────────────────────────────────────────────


def test_parse_date_valid():
    assert _parse_date("2024-04-06") == date(2024, 4, 6)


def test_parse_date_with_time():
    assert _parse_date("2024-04-06T12:00:00") == date(2024, 4, 6)


def test_parse_date_none():
    assert _parse_date(None) is None


def test_parse_date_invalid():
    assert _parse_date("not-a-date") is None


def test_savings_eligible_basic():
    attrs = {"Interest Rate": "2.5"}
    assert _savings_eligible("Savings Account", attrs, date(2024, 4, 6), date(2025, 4, 5))


def test_savings_eligible_isa_excluded():
    attrs = {"Interest Rate": "2.5"}
    for isa_type in ("Cash ISA", "Fixed Rate ISA", "Stocks ISA"):
        assert not _savings_eligible(isa_type, attrs, date(2024, 4, 6), date(2025, 4, 5))


def test_savings_eligible_no_interest_rate():
    assert not _savings_eligible("Savings Account", {}, date(2024, 4, 6), date(2025, 4, 5))


def test_savings_eligible_opened_after_period_end():
    attrs = {"Interest Rate": "2.5", "Account Opened Date": "2025-06-01"}
    assert not _savings_eligible("Savings Account", attrs, date(2024, 4, 6), date(2025, 4, 5))


def test_savings_eligible_closed_before_period_start():
    attrs = {"Interest Rate": "2.5", "Account Closed Date": "2023-12-31"}
    assert not _savings_eligible("Savings Account", attrs, date(2024, 4, 6), date(2025, 4, 5))


def test_savings_eligible_closed_during_period():
    attrs = {"Interest Rate": "2.5", "Account Closed Date": "2024-09-15"}
    assert _savings_eligible("Savings Account", attrs, date(2024, 4, 6), date(2025, 4, 5))


def test_shares_sold_eligible_in_period():
    attrs = {"Account Closed Date": "2024-09-01"}
    assert _shares_sold_eligible("Shares", attrs, date(2024, 4, 6), date(2025, 4, 5))


def test_shares_sold_eligible_wrong_type():
    attrs = {"Account Closed Date": "2024-09-01"}
    assert not _shares_sold_eligible("Savings Account", attrs, date(2024, 4, 6), date(2025, 4, 5))


def test_shares_sold_not_eligible_outside_period():
    attrs = {"Account Closed Date": "2023-01-01"}
    assert not _shares_sold_eligible("Shares", attrs, date(2024, 4, 6), date(2025, 4, 5))


def test_shares_sold_not_eligible_no_closed_date():
    assert not _shares_sold_eligible("Shares", {}, date(2024, 4, 6), date(2025, 4, 5))


# ── Integration tests ────────────────────────────────────────────────────────


async def _get_or_create_ref(
    session: AsyncSession, class_key: str, value: str
) -> int:
    result = await session.execute(
        select(ReferenceData.id).where(
            ReferenceData.class_key == class_key,
            ReferenceData.reference_value == value,
        )
    )
    row = result.scalar_one_or_none()
    if row is not None:
        return row
    ref = ReferenceData(class_key=class_key, reference_value=value, sort_index=99)
    session.add(ref)
    await session.flush()
    await session.refresh(ref)
    return ref.id


@pytest.mark.asyncio
async def test_get_eligible_with_returns_savings(
    db_session: AsyncSession, user: UserProfile
) -> None:
    """Savings account with interest rate should be eligible."""
    type_id = await _get_or_create_ref(db_session, "account_type", "Savings Account")
    status_id = await _get_or_create_ref(db_session, "account_status", "Active")
    ir_attr_id = await _get_or_create_ref(db_session, "account_attribute_type", "Interest Rate")

    period = TaxPeriod()
    period.user_id = user.id
    period.name = "2024/25"
    period.start_date = date(2024, 4, 6)
    period.end_date = date(2025, 4, 5)
    period.created_at = period.updated_at = datetime.utcnow()
    db_session.add(period)

    account = Account(user_id=user.id, name="Savings", type_id=type_id, status_id=status_id)
    db_session.add(account)
    await db_session.flush()

    attr = AccountAttribute(
        user_id=user.id, account_id=account.id, type_id=ir_attr_id, value="2.5"
    )
    db_session.add(attr)
    await db_session.flush()
    await db_session.refresh(period)

    results = await get_eligible_with_returns(
        db_session, user.id, period.id, period.start_date, period.end_date
    )
    assert len(results) == 1
    assert results[0]["eligibility_reason"] == "interest_bearing"
    assert results[0]["interest_rate"] == "2.5"


@pytest.mark.asyncio
async def test_get_eligible_with_returns_no_eligible(
    db_session: AsyncSession, user: UserProfile
) -> None:
    """Account without interest rate should not be eligible."""
    type_id = await _get_or_create_ref(db_session, "account_type", "Current Account")
    status_id = await _get_or_create_ref(db_session, "account_status", "Active")

    period = TaxPeriod()
    period.user_id = user.id
    period.name = "2024/25"
    period.start_date = date(2024, 4, 6)
    period.end_date = date(2025, 4, 5)
    period.created_at = period.updated_at = datetime.utcnow()
    db_session.add(period)

    account = Account(user_id=user.id, name="Current", type_id=type_id, status_id=status_id)
    db_session.add(account)
    await db_session.flush()
    await db_session.refresh(period)

    results = await get_eligible_with_returns(
        db_session, user.id, period.id, period.start_date, period.end_date
    )
    assert len(results) == 0
