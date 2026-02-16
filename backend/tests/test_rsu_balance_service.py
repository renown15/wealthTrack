"""Tests for RSU balance service."""

import pytest
from unittest.mock import AsyncMock, MagicMock

from app.repositories.account_attribute_repository import AccountAttributeRepository
from app.services.rsu_balance_service import RSUBalanceService


class TestRSUBalanceService:
    """Test RSUBalanceService with injected repository."""

    def test_initialization_with_repo(self):
        """Test service accepts injected repository."""
        mock_session = AsyncMock()
        mock_repo = AsyncMock(spec=AccountAttributeRepository)
        mock_repo.session = mock_session

        service = RSUBalanceService(mock_repo)

        assert service.repo is mock_repo
        assert service.session is mock_session

    @pytest.mark.asyncio
    async def test_save_successful(self):
        """Test successful balance save."""
        mock_session = AsyncMock()
        mock_repo = AsyncMock(spec=AccountAttributeRepository)
        mock_repo.session = mock_session
        mock_repo.get_attribute_type_id = AsyncMock(return_value=12)
        mock_repo.set_attribute = AsyncMock()

        balance_event_result = MagicMock()
        balance_event_result.scalar_one_or_none.return_value = None
        event_type_result = MagicMock()
        event_type_result.scalar_one_or_none.return_value = 5
        mock_session.execute.side_effect = [balance_event_result, event_type_result]
        mock_session.flush = AsyncMock()

        service = RSUBalanceService(mock_repo)
        result = await service.save_daily_balance(1, 1, 200.0)

        assert result is True
        mock_repo.set_attribute.assert_called_once()

    @pytest.mark.asyncio
    async def test_save_missing_event_type(self):
        """Test fails when event type not found."""
        mock_session = AsyncMock()
        mock_repo = AsyncMock(spec=AccountAttributeRepository)
        mock_repo.session = mock_session
        mock_repo.get_attribute_type_id = AsyncMock(return_value=12)

        balance_event_result = MagicMock()
        balance_event_result.scalar_one_or_none.return_value = None
        event_type_result = MagicMock()
        event_type_result.scalar_one_or_none.return_value = None
        mock_session.execute.side_effect = [balance_event_result, event_type_result]

        service = RSUBalanceService(mock_repo)
        result = await service.save_daily_balance(1, 1, 200.0)

        assert result is False

    @pytest.mark.asyncio
    async def test_save_missing_attribute_type(self):
        """Test fails when attribute type not found."""
        mock_session = AsyncMock()
        mock_repo = AsyncMock(spec=AccountAttributeRepository)
        mock_repo.session = mock_session
        mock_repo.get_attribute_type_id = AsyncMock(return_value=None)

        service = RSUBalanceService(mock_repo)
        result = await service.save_daily_balance(1, 1, 200.0)

        assert result is False

    @pytest.mark.asyncio
    async def test_save_error_exception(self):
        """Test error handling for exceptions."""
        mock_session = AsyncMock()
        mock_repo = AsyncMock(spec=AccountAttributeRepository)
        mock_repo.session = mock_session
        mock_repo.get_attribute_type_id = AsyncMock(side_effect=KeyError("Missing key"))

        service = RSUBalanceService(mock_repo)
        result = await service.save_daily_balance(1, 1, 200.0)

        assert result is False
