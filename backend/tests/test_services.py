"""
Integration tests for services with mocked database.
"""
from unittest.mock import AsyncMock

import pytest

from app.models.account import Account
from app.models.institution import Institution
from app.services.account_event_service import AccountEventService
from app.services.account_service import AccountService
from app.services.institution_service import InstitutionService

# =============================================================================
# AccountService Tests
# =============================================================================


@pytest.mark.asyncio
async def test_account_service_initialized():
    """Test AccountService is properly initialized."""
    mock_session = AsyncMock()
    service = AccountService(mock_session)
    assert service.session is not None
    assert hasattr(service, "repository")
    assert callable(service.update)
    assert callable(service.delete)


@pytest.mark.asyncio
async def test_account_service_update_success():
    """Test AccountService.update() with successful update."""
    mock_session = AsyncMock()
    service = AccountService(mock_session)

    # Mock repository get_by_id
    mock_account = Account(id=1, userid=1, institutionid=1, name="Old Name")
    service.repository.get_by_id = AsyncMock(return_value=mock_account)

    result = await service.update(1, 1, name="New Name")
    assert result is True
    assert mock_account.name == "New Name"


@pytest.mark.asyncio
async def test_account_service_update_not_found():
    """Test AccountService.update() with account not found."""
    mock_session = AsyncMock()
    service = AccountService(mock_session)

    # Mock repository get_by_id to return None
    service.repository.get_by_id = AsyncMock(return_value=None)

    with pytest.raises(ValueError):
        await service.update(1, 1, name="New Name")


@pytest.mark.asyncio
async def test_account_service_update_with_multiple_fields():
    """Test AccountService.update() with multiple allowed fields."""
    mock_session = AsyncMock()
    service = AccountService(mock_session)

    # Mock repository get_by_id
    mock_account = Account(id=1, userid=1, institutionid=1, name="Old")
    mock_account.typeid = 1
    mock_account.statusid = 1
    service.repository.get_by_id = AsyncMock(return_value=mock_account)

    result = await service.update(1, 1, name="New", typeid=2, statusid=3)
    assert result is True
    assert mock_account.name == "New"
    assert mock_account.typeid == 2
    assert mock_account.statusid == 3


@pytest.mark.asyncio
async def test_account_service_delete_success():
    """Test AccountService.delete() with successful delete."""
    mock_session = AsyncMock()
    service = AccountService(mock_session)

    # Mock repository get_by_id
    mock_account = Account(id=1, userid=1, institutionid=1, name="Test Account")
    service.repository.get_by_id = AsyncMock(return_value=mock_account)

    result = await service.delete(1, 1)
    assert result is True


@pytest.mark.asyncio
async def test_account_service_delete_not_found():
    """Test AccountService.delete() with account not found."""
    mock_session = AsyncMock()
    service = AccountService(mock_session)

    # Mock repository get_by_id to return None
    service.repository.get_by_id = AsyncMock(return_value=None)

    with pytest.raises(ValueError):
        await service.delete(1, 1)


# =============================================================================
# InstitutionService Tests
# =============================================================================


@pytest.mark.asyncio
async def test_institution_service_initialized():
    """Test InstitutionService is properly initialized."""
    mock_session = AsyncMock()
    service = InstitutionService(mock_session)
    assert service.session is not None
    assert hasattr(service, "repository")
    assert callable(service.update)
    assert callable(service.delete)


@pytest.mark.asyncio
async def test_institution_service_update_success():
    """Test InstitutionService.update() with successful update."""
    mock_session = AsyncMock()
    service = InstitutionService(mock_session)

    # Mock repository get_by_id
    mock_institution = Institution(id=1, userid=1, name="Old Bank")
    service.repository.get_by_id = AsyncMock(return_value=mock_institution)

    result = await service.update(1, 1, "New Bank")
    assert result is True
    assert mock_institution.name == "New Bank"


@pytest.mark.asyncio
async def test_institution_service_update_not_found():
    """Test InstitutionService.update() with institution not found."""
    mock_session = AsyncMock()
    service = InstitutionService(mock_session)

    # Mock repository get_by_id to return None
    service.repository.get_by_id = AsyncMock(return_value=None)

    with pytest.raises(ValueError):
        await service.update(1, 1, "New Bank")


@pytest.mark.asyncio
async def test_institution_service_delete_success():
    """Test InstitutionService.delete() with successful delete."""
    mock_session = AsyncMock()
    service = InstitutionService(mock_session)

    # Mock repository get_by_id
    mock_institution = Institution(id=1, userid=1, name="Old Bank")
    service.repository.get_by_id = AsyncMock(return_value=mock_institution)

    result = await service.delete(1, 1)
    assert result is True


@pytest.mark.asyncio
async def test_institution_service_delete_not_found():
    """Test InstitutionService.delete() with institution not found."""
    mock_session = AsyncMock()
    service = InstitutionService(mock_session)

    # Mock repository get_by_id to return None
    service.repository.get_by_id = AsyncMock(return_value=None)

    with pytest.raises(ValueError):
        await service.delete(1, 1)


# =============================================================================
# AccountEventService Tests
# =============================================================================


@pytest.mark.asyncio
async def test_account_event_service_initialized():
    """Test AccountEventService is properly initialized."""
    mock_session = AsyncMock()
    service = AccountEventService(mock_session)
    assert service.session is not None
    assert hasattr(service, "account_repository")
    assert callable(service.log_event)


@pytest.mark.asyncio
async def test_account_event_service_log_event_success():
    """Test AccountEventService.log_event() with successful logging."""
    mock_session = AsyncMock()
    service = AccountEventService(mock_session)

    # Mock account repository get_by_id
    mock_account = Account(id=1, userid=1, institutionid=1, name="Test Account")
    service.account_repository.get_by_id = AsyncMock(return_value=mock_account)

    result = await service.log_event(1, 1, 1, "1000.00")
    assert result is True


@pytest.mark.asyncio
async def test_account_event_service_log_event_account_not_found():
    """Test AccountEventService.log_event() with account not found."""
    mock_session = AsyncMock()
    service = AccountEventService(mock_session)

    # Mock account repository get_by_id to return None
    service.account_repository.get_by_id = AsyncMock(return_value=None)

    with pytest.raises(ValueError):
        await service.log_event(1, 1, 1, "1000.00")


@pytest.mark.asyncio
async def test_account_event_service_log_multiple_events():
    """Test AccountEventService.log_event() with multiple events."""
    mock_session = AsyncMock()
    service = AccountEventService(mock_session)

    # Mock account repository get_by_id
    mock_account = Account(id=1, userid=1, institutionid=1, name="Test Account")
    service.account_repository.get_by_id = AsyncMock(return_value=mock_account)

    # Log multiple events
    result1 = await service.log_event(1, 1, 1, "1000.00")
    result2 = await service.log_event(1, 1, 1, "1500.00")
    result3 = await service.log_event(1, 1, 1, "2000.00")

    assert result1 is True
    assert result2 is True
    assert result3 is True
    assert mock_session.add.call_count == 3
    assert mock_session.flush.call_count == 3
