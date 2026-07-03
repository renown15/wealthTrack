"""Tests for analytics repository — verifies closed accounts are excluded from aggregates."""

from datetime import datetime

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.account_event import AccountEvent
from app.models.institution import Institution
from app.models.reference_data import ReferenceData
from app.models.user_profile import UserProfile
from app.repositories.analytics_history import get_portfolio_history
from app.repositories.analytics_repository import AnalyticsRepository


async def _get_type_id(session: AsyncSession, class_key: str, value: str) -> int:
    result = await session.execute(
        select(ReferenceData).where(
            ReferenceData.class_key == class_key,
            ReferenceData.reference_value == value,
        )
    )
    return result.scalar_one().id


async def _add_balance_event(
    session: AsyncSession,
    account: Account,
    balance_type_id: int,
    value: str,
) -> None:
    event = AccountEvent(
        account_id=account.id,
        user_id=account.user_id,
        type_id=balance_type_id,
        value=value,
        created_at=datetime.utcnow(),
    )
    session.add(event)
    await session.flush()


@pytest.mark.asyncio
async def test_closed_accounts_excluded_from_total(
    db_session: AsyncSession,
    user: UserProfile,
    institution: Institution,
):
    """Closed accounts must not contribute to breakdown totals."""
    active_type_id = await _get_type_id(db_session, "account_status", "Active")
    closed_type_id = await _get_type_id(db_session, "account_status", "Closed")
    acct_type_id = await _get_type_id(db_session, "account_type", "Savings Account")
    balance_type_id = await _get_type_id(db_session, "account_event_type", "Balance Update")

    active_account = Account(
        user_id=user.id, institution_id=institution.id,
        name="Active Savings", type_id=acct_type_id, status_id=active_type_id,
    )
    closed_account = Account(
        user_id=user.id, institution_id=institution.id,
        name="Closed Savings", type_id=acct_type_id, status_id=closed_type_id,
    )
    db_session.add_all([active_account, closed_account])
    await db_session.flush()

    await _add_balance_event(db_session, active_account, balance_type_id, "1000.00")
    await _add_balance_event(db_session, closed_account, balance_type_id, "500.00")

    repo = AnalyticsRepository(db_session)
    result = await repo.get_portfolio_breakdown(user.id)

    assert result["total"] == 1000.0


@pytest.mark.asyncio
async def test_closed_accounts_excluded_from_by_type(
    db_session: AsyncSession,
    user: UserProfile,
    institution: Institution,
):
    """Closed accounts must not contribute to by_type segment values."""
    active_type_id = await _get_type_id(db_session, "account_status", "Active")
    closed_type_id = await _get_type_id(db_session, "account_status", "Closed")
    acct_type_id = await _get_type_id(db_session, "account_type", "Savings Account")
    balance_type_id = await _get_type_id(db_session, "account_event_type", "Balance Update")

    active_account = Account(
        user_id=user.id, institution_id=institution.id,
        name="Active", type_id=acct_type_id, status_id=active_type_id,
    )
    closed_account = Account(
        user_id=user.id, institution_id=institution.id,
        name="Closed", type_id=acct_type_id, status_id=closed_type_id,
    )
    db_session.add_all([active_account, closed_account])
    await db_session.flush()

    await _add_balance_event(db_session, active_account, balance_type_id, "2000.00")
    await _add_balance_event(db_session, closed_account, balance_type_id, "999.00")

    repo = AnalyticsRepository(db_session)
    result = await repo.get_portfolio_breakdown(user.id)

    savings_segment = next(s for s in result["by_type"] if s["label"] == "Savings Account")
    assert savings_segment["value"] == 2000.0


@pytest.mark.asyncio
async def test_closed_accounts_appear_in_detail_list(
    db_session: AsyncSession,
    user: UserProfile,
    institution: Institution,
):
    """Closed accounts must still appear in accounts detail lists with is_closed=True."""
    active_type_id = await _get_type_id(db_session, "account_status", "Active")
    closed_type_id = await _get_type_id(db_session, "account_status", "Closed")
    acct_type_id = await _get_type_id(db_session, "account_type", "Savings Account")
    balance_type_id = await _get_type_id(db_session, "account_event_type", "Balance Update")

    active_account = Account(
        user_id=user.id, institution_id=institution.id,
        name="Active", type_id=acct_type_id, status_id=active_type_id,
    )
    closed_account = Account(
        user_id=user.id, institution_id=institution.id,
        name="Closed", type_id=acct_type_id, status_id=closed_type_id,
    )
    db_session.add_all([active_account, closed_account])
    await db_session.flush()

    await _add_balance_event(db_session, active_account, balance_type_id, "1000.00")
    await _add_balance_event(db_session, closed_account, balance_type_id, "500.00")

    repo = AnalyticsRepository(db_session)
    result = await repo.get_portfolio_breakdown(user.id)

    savings_segment = next(s for s in result["by_type"] if s["label"] == "Savings Account")
    accounts = savings_segment["accounts"]
    assert len(accounts) == 2
    closed = next(a for a in accounts if a["account_name"] == "Closed")
    active = next(a for a in accounts if a["account_name"] == "Active")
    assert closed["is_closed"] is True
    assert active["is_closed"] is False


@pytest.mark.asyncio
async def test_history_excludes_closed_accounts(
    db_session: AsyncSession,
    user: UserProfile,
    institution: Institution,
):
    """Closed accounts must not appear in portfolio history totals."""
    active_type_id = await _get_type_id(db_session, "account_status", "Active")
    closed_type_id = await _get_type_id(db_session, "account_status", "Closed")
    acct_type_id = await _get_type_id(db_session, "account_type", "Savings Account")
    balance_type_id = await _get_type_id(db_session, "account_event_type", "Balance Update")

    active_account = Account(
        user_id=user.id, institution_id=institution.id,
        name="Active", type_id=acct_type_id, status_id=active_type_id,
    )
    closed_account = Account(
        user_id=user.id, institution_id=institution.id,
        name="Closed", type_id=acct_type_id, status_id=closed_type_id,
    )
    db_session.add_all([active_account, closed_account])
    await db_session.flush()

    await _add_balance_event(db_session, active_account, balance_type_id, "1000.00")
    await _add_balance_event(db_session, closed_account, balance_type_id, "500.00")

    result = await get_portfolio_history(db_session, user.id)
    history = result["history"]
    assert history, "expected at least one history entry"
    latest = history[-1]
    assert latest["total_value"] == 1000.0


@pytest.mark.asyncio
async def test_outgoing_accounts_excluded_from_breakdown_and_history(
    db_session: AsyncSession,
    user: UserProfile,
    institution: Institution,
):
    """Outgoings (utilities/insurance/subscriptions) belong to the Outgoings Hub only."""
    active_type_id = await _get_type_id(db_session, "account_status", "Active")
    savings_type_id = await _get_type_id(db_session, "account_type", "Savings Account")
    balance_type_id = await _get_type_id(db_session, "account_event_type", "Balance Update")
    # The conftest seeds a subset of reference data; add the outgoing type it needs.
    db_session.add(
        ReferenceData(class_key="account_type", reference_value="Subscription", sort_index=59)
    )
    await db_session.flush()
    sub_type_id = await _get_type_id(db_session, "account_type", "Subscription")

    savings = Account(
        user_id=user.id, institution_id=institution.id,
        name="Savings", type_id=savings_type_id, status_id=active_type_id,
    )
    subscription = Account(
        user_id=user.id, institution_id=institution.id,
        name="Netflix", type_id=sub_type_id, status_id=active_type_id,
    )
    db_session.add_all([savings, subscription])
    await db_session.flush()
    await _add_balance_event(db_session, savings, balance_type_id, "1000.00")
    await _add_balance_event(db_session, subscription, balance_type_id, "15.00")

    breakdown = await AnalyticsRepository(db_session).get_portfolio_breakdown(user.id)
    assert breakdown["total"] == 1000.0  # subscription excluded
    assert all(seg["label"] != "Subscription" for seg in breakdown["by_type"])

    history = await get_portfolio_history(db_session, user.id)
    assert history["history"][-1]["total_value"] == 1000.0  # subscription excluded
