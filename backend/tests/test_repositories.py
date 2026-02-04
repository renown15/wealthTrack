"""
Integration tests for repositories with mocked database.
"""
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.repositories.account_repository import AccountRepository
from app.repositories.institution_repository import InstitutionRepository
from app.repositories.portfolio_repository import PortfolioRepository

# =============================================================================
# AccountRepository Tests
# =============================================================================


@pytest.mark.asyncio
async def test_account_repository_initialized():
    """Test AccountRepository is properly initialized."""
    mock_session = AsyncMock()
    repo = AccountRepository(mock_session)
    assert repo.session is not None
    assert callable(repo.get_by_id)
    assert callable(repo.get_by_user)
    assert callable(repo.get_by_institution)


@pytest.mark.asyncio
async def test_account_repository_get_by_id():
    """Test AccountRepository.get_by_id() returns result."""
    mock_session = AsyncMock()
    repo = AccountRepository(mock_session)

    # Mock the execute result
    mock_result = MagicMock()
    mock_result.scalar_one_or_none = MagicMock(return_value="mock_account")

    mock_session.execute = AsyncMock(return_value=mock_result)

    # Call the method
    await repo.get_by_id(1, 1)
    mock_session.execute.assert_called_once()


@pytest.mark.asyncio
async def test_account_repository_get_by_user():
    """Test AccountRepository.get_by_user() returns list."""
    mock_session = AsyncMock()
    repo = AccountRepository(mock_session)

    # Mock the execute result
    mock_scalars = MagicMock()
    mock_scalars.all = MagicMock(return_value=[])
    mock_result = MagicMock()
    mock_result.scalars = MagicMock(return_value=mock_scalars)

    mock_session.execute = AsyncMock(return_value=mock_result)

    result = await repo.get_by_user(1)
    assert isinstance(result, list)
    mock_session.execute.assert_called_once()


@pytest.mark.asyncio
async def test_account_repository_get_by_institution():
    """Test AccountRepository.get_by_institution() returns list."""
    mock_session = AsyncMock()
    repo = AccountRepository(mock_session)

    # Mock the execute result
    mock_scalars = MagicMock()
    mock_scalars.all = MagicMock(return_value=[])
    mock_result = MagicMock()
    mock_result.scalars = MagicMock(return_value=mock_scalars)

    mock_session.execute = AsyncMock(return_value=mock_result)

    result = await repo.get_by_institution(1, 1)
    assert isinstance(result, list)
    mock_session.execute.assert_called_once()


# =============================================================================
# InstitutionRepository Tests
# =============================================================================


@pytest.mark.asyncio
async def test_institution_repository_initialized():
    """Test InstitutionRepository is properly initialized."""
    mock_session = AsyncMock()
    repo = InstitutionRepository(mock_session)
    assert repo.session is not None
    assert callable(repo.get_by_id)
    assert callable(repo.get_by_user)


@pytest.mark.asyncio
async def test_institution_repository_get_by_id():
    """Test InstitutionRepository.get_by_id() returns result."""
    mock_session = AsyncMock()
    repo = InstitutionRepository(mock_session)

    # Mock the execute result
    mock_result = MagicMock()
    mock_result.scalar_one_or_none = MagicMock(return_value="mock_institution")

    mock_session.execute = AsyncMock(return_value=mock_result)

    await repo.get_by_id(1, 1)
    mock_session.execute.assert_called_once()


@pytest.mark.asyncio
async def test_institution_repository_get_by_user():
    """Test InstitutionRepository.get_by_user() returns list."""
    mock_session = AsyncMock()
    repo = InstitutionRepository(mock_session)

    # Mock the execute result
    mock_scalars = MagicMock()
    mock_scalars.all = MagicMock(return_value=[])
    mock_result = MagicMock()
    mock_result.scalars = MagicMock(return_value=mock_scalars)

    mock_session.execute = AsyncMock(return_value=mock_result)

    result = await repo.get_by_user(1)
    assert isinstance(result, list)
    mock_session.execute.assert_called_once()


# =============================================================================
# PortfolioRepository Tests
# =============================================================================


@pytest.mark.asyncio
async def test_portfolio_repository_initialized():
    """Test PortfolioRepository is properly initialized."""
    mock_session = AsyncMock()
    repo = PortfolioRepository(mock_session)
    assert repo.session is not None
    assert callable(repo.get_user_portfolio)
    assert callable(repo.get_account_current_balance)


@pytest.mark.asyncio
async def test_portfolio_repository_get_user_portfolio():
    """Test PortfolioRepository.get_user_portfolio() returns list."""
    mock_session = AsyncMock()
    repo = PortfolioRepository(mock_session)

    # Mock account results
    mock_scalars = MagicMock()
    mock_scalars.all = MagicMock(return_value=[])
    mock_result = MagicMock()
    mock_result.scalars = MagicMock(return_value=mock_scalars)

    mock_session.execute = AsyncMock(return_value=mock_result)

    result = await repo.get_user_portfolio(1)
    assert isinstance(result, list)


@pytest.mark.asyncio
async def test_portfolio_repository_get_account_current_balance():
    """Test PortfolioRepository.get_account_current_balance()."""
    mock_session = AsyncMock()
    repo = PortfolioRepository(mock_session)

    # Mock the execute result
    mock_result = MagicMock()
    mock_result.scalar_one_or_none = MagicMock(return_value="1000.00")

    mock_session.execute = AsyncMock(return_value=mock_result)

    result = await repo.get_account_current_balance(1, 1)
    assert result == "1000.00"
    mock_session.execute.assert_called_once()
