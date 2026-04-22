"""Tests for SharesBalanceService."""
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.repositories.account_attribute_repository import AccountAttributeRepository
from app.services.shares_balance_service import SharesBalanceService


def _make_service():
    mock_session = AsyncMock()
    mock_repo = AsyncMock(spec=AccountAttributeRepository)
    mock_repo.session = mock_session
    return SharesBalanceService(mock_repo), mock_repo, mock_session


class TestSharesBalanceServiceInit:
    def test_stores_repo_and_session(self):
        _, mock_repo, mock_session = _make_service()
        svc = SharesBalanceService(mock_repo)
        assert svc.repo is mock_repo
        assert svc.session is mock_session


class TestSaveDailyBalance:
    @pytest.mark.asyncio
    async def test_returns_false_when_attr_type_not_found(self):
        svc, mock_repo, _ = _make_service()
        mock_repo.get_attribute_type_id = AsyncMock(return_value=None)
        result = await svc.save_daily_balance(1, 1, 100.0)
        assert result is False

    @pytest.mark.asyncio
    async def test_returns_false_when_balance_already_saved_today(self):
        svc, mock_repo, mock_session = _make_service()
        mock_repo.get_attribute_type_id = AsyncMock(return_value=5)
        existing = MagicMock()
        existing.value = "100.00"
        balance_result = MagicMock()
        balance_result.scalar_one_or_none.return_value = existing
        mock_session.execute = AsyncMock(return_value=balance_result)

        result = await svc.save_daily_balance(1, 1, 100.0)
        assert result is False

    @pytest.mark.asyncio
    async def test_returns_false_when_event_type_not_found(self):
        svc, mock_repo, mock_session = _make_service()
        mock_repo.get_attribute_type_id = AsyncMock(return_value=5)
        no_event = MagicMock()
        no_event.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=no_event)

        result = await svc.save_daily_balance(1, 1, 100.0)
        assert result is False

    @pytest.mark.asyncio
    async def test_returns_true_on_success(self):
        svc, mock_repo, mock_session = _make_service()
        mock_repo.get_attribute_type_id = AsyncMock(return_value=5)
        mock_repo.set_attribute = AsyncMock()
        mock_session.flush = AsyncMock()

        no_balance = MagicMock()
        no_balance.scalar_one_or_none.return_value = None
        event_type = MagicMock()
        event_type.scalar_one_or_none.return_value = 7
        mock_session.execute = AsyncMock(side_effect=[no_balance, event_type])

        result = await svc.save_daily_balance(1, 1, 250.75)
        assert result is True
        mock_repo.set_attribute.assert_called_once()

    @pytest.mark.asyncio
    async def test_saves_price_when_provided(self):
        svc, mock_repo, mock_session = _make_service()
        mock_repo.get_attribute_type_id = AsyncMock(return_value=5)
        mock_repo.set_attribute = AsyncMock()
        mock_repo.set_attribute_by_name = AsyncMock()
        mock_session.flush = AsyncMock()

        no_balance = MagicMock()
        no_balance.scalar_one_or_none.return_value = None
        event_type = MagicMock()
        event_type.scalar_one_or_none.return_value = 7
        mock_session.execute = AsyncMock(side_effect=[no_balance, event_type])

        result = await svc.save_daily_balance(1, 1, 250.75, price="1500")
        assert result is True
        mock_repo.set_attribute_by_name.assert_called_once_with(1, 1, "price", "1500")

    @pytest.mark.asyncio
    async def test_returns_false_on_exception(self):
        svc, mock_repo, _ = _make_service()
        mock_repo.get_attribute_type_id = AsyncMock(side_effect=RuntimeError("db error"))

        result = await svc.save_daily_balance(1, 1, 100.0)
        assert result is False
