"""Tests for deferred cash and shares balance services."""

import pytest
from unittest.mock import AsyncMock, MagicMock

from app.repositories.account_attribute_repository import AccountAttributeRepository
from app.services.deferred_cash_balance_service import DeferredCashBalanceService
from app.services.deferred_shares_balance_service import DeferredSharesBalanceService


class TestDeferredCashBalanceService:
    """Test DeferredCashBalanceService with injected repository."""

    def test_initialization_with_repo(self):
        """Test service accepts injected repository."""
        mock_session = AsyncMock()
        mock_repo = AsyncMock(spec=AccountAttributeRepository)
        mock_repo.session = mock_session

        service = DeferredCashBalanceService(mock_repo)

        assert service.repo is mock_repo
        assert service.session is mock_session

    @pytest.mark.asyncio
    async def test_save_successful(self):
        """Test successful balance save."""
        mock_session = AsyncMock()
        mock_repo = AsyncMock(spec=AccountAttributeRepository)
        mock_repo.session = mock_session
        mock_repo.get_attribute_type_id = AsyncMock(return_value=10)
        mock_repo.set_attribute = AsyncMock()

        balance_event_result = MagicMock()
        balance_event_result.scalar_one_or_none.return_value = None
        event_type_result = MagicMock()
        event_type_result.scalar_one_or_none.return_value = 5
        mock_session.execute.side_effect = [balance_event_result, event_type_result]
        mock_session.flush = AsyncMock()

        service = DeferredCashBalanceService(mock_repo)
        result = await service.save_daily_balance(1, 1, 100.0)

        assert result is True
        mock_repo.set_attribute.assert_called_once()

    @pytest.mark.asyncio
    async def test_save_already_saved_today(self):
        """Test balance already saved today returns False."""
        from datetime import date
        mock_session = AsyncMock()
        mock_repo = AsyncMock(spec=AccountAttributeRepository)
        mock_repo.session = mock_session
        mock_repo.get_attribute_type_id = AsyncMock(return_value=10)

        existing_attr = MagicMock()
        existing_attr.updated_at.date.return_value = date.today()
        mock_repo.get_attribute = AsyncMock(return_value=existing_attr)

        service = DeferredCashBalanceService(mock_repo)
        result = await service.save_daily_balance(1, 1, 100.0)

        assert result is False

    @pytest.mark.asyncio
    async def test_save_with_stale_existing_attribute(self):
        """Test save proceeds when existing attribute is from a previous day."""
        from datetime import date, timedelta
        mock_session = AsyncMock()
        mock_repo = AsyncMock(spec=AccountAttributeRepository)
        mock_repo.session = mock_session
        mock_repo.get_attribute_type_id = AsyncMock(return_value=10)

        existing_attr = MagicMock()
        existing_attr.updated_at.date.return_value = date.today() - timedelta(days=1)
        mock_repo.get_attribute = AsyncMock(return_value=existing_attr)
        mock_repo.set_attribute = AsyncMock()

        service = DeferredCashBalanceService(mock_repo)
        result = await service.save_daily_balance(1, 1, 100.0)

        assert result is True
        mock_repo.set_attribute.assert_called_once()

    @pytest.mark.asyncio
    async def test_save_missing_attribute_type(self):
        """Test fails when attribute type not found."""
        mock_session = AsyncMock()
        mock_repo = AsyncMock(spec=AccountAttributeRepository)
        mock_repo.session = mock_session
        mock_repo.get_attribute_type_id = AsyncMock(return_value=None)

        service = DeferredCashBalanceService(mock_repo)
        result = await service.save_daily_balance(1, 1, 100.0)

        assert result is False

    @pytest.mark.asyncio
    async def test_save_error_exception(self):
        """Test error handling for exceptions."""
        mock_session = AsyncMock()
        mock_repo = AsyncMock(spec=AccountAttributeRepository)
        mock_repo.session = mock_session
        mock_repo.get_attribute_type_id = AsyncMock(side_effect=ValueError("DB error"))

        service = DeferredCashBalanceService(mock_repo)
        result = await service.save_daily_balance(1, 1, 100.0)

        assert result is False


class TestDeferredSharesBalanceService:
    """Test DeferredSharesBalanceService with injected repository."""

    def test_initialization_with_repo(self):
        """Test service accepts injected repository."""
        mock_session = AsyncMock()
        mock_repo = AsyncMock(spec=AccountAttributeRepository)
        mock_repo.session = mock_session

        service = DeferredSharesBalanceService(mock_repo)

        assert service.repo is mock_repo
        assert service.session is mock_session

    @pytest.mark.asyncio
    async def test_save_successful(self):
        """Test successful balance save."""
        mock_session = AsyncMock()
        mock_repo = AsyncMock(spec=AccountAttributeRepository)
        mock_repo.session = mock_session
        mock_repo.get_attribute_type_id = AsyncMock(return_value=11)
        mock_repo.set_attribute = AsyncMock()

        balance_event_result = MagicMock()
        balance_event_result.scalar_one_or_none.return_value = None
        event_type_result = MagicMock()
        event_type_result.scalar_one_or_none.return_value = 5
        mock_session.execute.side_effect = [balance_event_result, event_type_result]
        mock_session.flush = AsyncMock()

        service = DeferredSharesBalanceService(mock_repo)
        result = await service.save_daily_balance(1, 1, 50.0)

        assert result is True
        mock_repo.set_attribute.assert_called_once()

    @pytest.mark.asyncio
    async def test_save_missing_event_type(self):
        """Test fails when event type not found."""
        mock_session = AsyncMock()
        mock_repo = AsyncMock(spec=AccountAttributeRepository)
        mock_repo.session = mock_session
        mock_repo.get_attribute_type_id = AsyncMock(return_value=11)

        balance_event_result = MagicMock()
        balance_event_result.scalar_one_or_none.return_value = None
        event_type_result = MagicMock()
        event_type_result.scalar_one_or_none.return_value = None
        mock_session.execute.side_effect = [balance_event_result, event_type_result]

        service = DeferredSharesBalanceService(mock_repo)
        result = await service.save_daily_balance(1, 1, 50.0)

        assert result is False

    @pytest.mark.asyncio
    async def test_save_missing_attribute_type(self):
        """Test fails when attribute type not found."""
        mock_session = AsyncMock()
        mock_repo = AsyncMock(spec=AccountAttributeRepository)
        mock_repo.session = mock_session
        mock_repo.get_attribute_type_id = AsyncMock(return_value=None)

        service = DeferredSharesBalanceService(mock_repo)
        result = await service.save_daily_balance(1, 1, 50.0)

        assert result is False

    @pytest.mark.asyncio
    async def test_save_error_exception(self):
        """Test error handling for exceptions."""
        mock_session = AsyncMock()
        mock_repo = AsyncMock(spec=AccountAttributeRepository)
        mock_repo.session = mock_session
        mock_repo.get_attribute_type_id = AsyncMock(side_effect=RuntimeError("Processing error"))

        service = DeferredSharesBalanceService(mock_repo)
        result = await service.save_daily_balance(1, 1, 50.0)

        assert result is False
