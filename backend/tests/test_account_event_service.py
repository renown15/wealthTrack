"""
Tests for AccountEventService.
"""
import pytest

from app.services.account_event_service import AccountEventService


@pytest.mark.asyncio
async def test_account_event_service_initialization():
    """Test AccountEventService can be initialized."""
    class MockSession:
        pass

    service = AccountEventService(MockSession())
    assert service is not None
    assert hasattr(service, "log_event")


@pytest.mark.asyncio
async def test_log_event_is_callable():
    """Test log_event method exists and is callable."""
    class MockSession:
        pass

    service = AccountEventService(MockSession())
    assert callable(service.log_event)
