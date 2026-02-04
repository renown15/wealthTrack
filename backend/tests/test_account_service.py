"""
Tests for AccountService.
"""
from unittest.mock import AsyncMock

import pytest

from app.services.account_service import AccountService


@pytest.mark.asyncio
async def test_account_service_initialization():
    """Test AccountService can be initialized."""
    mock_session = AsyncMock()
    service = AccountService(mock_session)
    assert service is not None
    assert hasattr(service, "repository")
    assert hasattr(service, "update")
    assert hasattr(service, "delete")


@pytest.mark.asyncio
async def test_update_is_callable():
    """Test update method is callable."""
    mock_session = AsyncMock()
    service = AccountService(mock_session)
    assert callable(service.update)


@pytest.mark.asyncio
async def test_delete_is_callable():
    """Test delete method is callable."""
    mock_session = AsyncMock()
    service = AccountService(mock_session)
    assert callable(service.delete)
