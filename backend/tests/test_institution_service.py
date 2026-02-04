"""
Tests for InstitutionService.
"""
from unittest.mock import AsyncMock

import pytest

from app.services.institution_service import InstitutionService


@pytest.mark.asyncio
async def test_institution_service_initialization():
    """Test InstitutionService can be initialized."""
    mock_session = AsyncMock()
    service = InstitutionService(mock_session)
    assert service is not None
    assert hasattr(service, "repository")
    assert hasattr(service, "update")
    assert hasattr(service, "delete")


@pytest.mark.asyncio
async def test_update_is_callable():
    """Test update method is callable."""
    mock_session = AsyncMock()
    service = InstitutionService(mock_session)
    assert callable(service.update)


@pytest.mark.asyncio
async def test_delete_is_callable():
    """Test delete method is callable."""
    mock_session = AsyncMock()
    service = InstitutionService(mock_session)
    assert callable(service.delete)
