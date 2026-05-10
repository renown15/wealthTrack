"""
Tests for account_transfer_service.close_and_transfer.
"""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.account_transfer_service import close_and_transfer


def _make_account(account_id: int, type_id: int = 1, status_id: int = 1) -> MagicMock:
    acct = MagicMock()
    acct.id = account_id
    acct.type_id = type_id
    acct.status_id = status_id
    return acct


@pytest.mark.asyncio
async def test_same_account_raises():
    """Transferring to the same account raises ValueError."""
    session = AsyncMock()
    with pytest.raises(ValueError, match="same account"):
        await close_and_transfer(1, 1, 99, session)


@pytest.mark.asyncio
async def test_source_not_found_raises():
    """Missing source account raises ValueError."""
    session = AsyncMock()
    with patch(
        "app.services.account_transfer_service.AccountRepository"
    ) as MockRepo:
        repo = MockRepo.return_value
        repo.get_by_id = AsyncMock(return_value=None)
        with pytest.raises(ValueError, match="Source account not found"):
            await close_and_transfer(1, 2, 99, session)


@pytest.mark.asyncio
async def test_target_not_found_raises():
    """Missing target account raises ValueError."""
    session = AsyncMock()
    source = _make_account(1)
    with patch(
        "app.services.account_transfer_service.AccountRepository"
    ) as MockRepo:
        repo = MockRepo.return_value
        repo.get_by_id = AsyncMock(side_effect=[source, None])
        with pytest.raises(ValueError, match="Target account not found"):
            await close_and_transfer(1, 2, 99, session)


@pytest.mark.asyncio
async def test_successful_transfer_creates_events():
    """Successful transfer creates withdrawal, balance-zero, deposit, and new-balance events.

    Uses different type_ids to confirm cross-type transfers are allowed (same asset group).
    """
    session = AsyncMock()
    source = _make_account(1, type_id=5)
    target = _make_account(2, type_id=6)

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = 10  # closed_status_id
    session.execute = AsyncMock(return_value=mock_result)

    with (
        patch("app.services.account_transfer_service.AccountRepository") as MockAcctRepo,
        patch("app.services.account_transfer_service.AccountEventRepository") as MockEvtRepo,
        patch("app.services.account_transfer_service.AccountAttributeRepository") as MockAttrRepo,
        patch("app.services.account_transfer_service.AccountService") as MockSvc,
    ):
        acct_repo = MockAcctRepo.return_value
        acct_repo.get_by_id = AsyncMock(side_effect=[source, target])

        evt_repo = MockEvtRepo.return_value
        evt_repo.get_latest_balance_update = AsyncMock(side_effect=["1000", "500"])
        # withdrawal, balance, deposit
        evt_repo.get_event_type_id = AsyncMock(side_effect=[3, 1, 4])
        evt_repo.create_event = AsyncMock()

        attr_repo = MockAttrRepo.return_value
        attr_repo.set_attribute_by_name = AsyncMock()

        svc = MockSvc.return_value
        svc.update = AsyncMock()

        await close_and_transfer(1, 2, 99, session)

        svc.update.assert_awaited_once_with(1, 99, status_id=10)
        attr_repo.set_attribute_by_name.assert_awaited_once()

        assert evt_repo.create_event.await_count == 4
        calls = evt_repo.create_event.await_args_list
        # Source withdrawal: 1000
        assert calls[0].args == (1, 99, 3, "1000")
        # Source balance reset: 0
        assert calls[1].args == (1, 99, 1, "0")
        # Target deposit: 1000
        assert calls[2].args == (2, 99, 4, "1000")
        # Target new balance: 500 + 1000 = 1500
        assert calls[3].args == (2, 99, 1, "1500")


@pytest.mark.asyncio
async def test_zero_source_balance_still_transfers():
    """A source account with no balance events transfers 0 gracefully."""
    session = AsyncMock()
    source = _make_account(1, type_id=3)
    target = _make_account(2, type_id=3)

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = 10
    session.execute = AsyncMock(return_value=mock_result)

    with (
        patch("app.services.account_transfer_service.AccountRepository") as MockAcctRepo,
        patch("app.services.account_transfer_service.AccountEventRepository") as MockEvtRepo,
        patch("app.services.account_transfer_service.AccountAttributeRepository") as MockAttrRepo,
        patch("app.services.account_transfer_service.AccountService") as MockSvc,
    ):
        acct_repo = MockAcctRepo.return_value
        acct_repo.get_by_id = AsyncMock(side_effect=[source, target])

        evt_repo = MockEvtRepo.return_value
        evt_repo.get_latest_balance_update = AsyncMock(side_effect=[None, None])
        evt_repo.get_event_type_id = AsyncMock(side_effect=[3, 1, 4])
        evt_repo.create_event = AsyncMock()

        attr_repo = MockAttrRepo.return_value
        attr_repo.set_attribute_by_name = AsyncMock()

        svc = MockSvc.return_value
        svc.update = AsyncMock()

        await close_and_transfer(1, 2, 99, session)

        calls = evt_repo.create_event.await_args_list
        assert calls[3].args == (2, 99, 1, "0")  # 0 + 0 = 0
