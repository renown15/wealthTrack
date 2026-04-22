"""
Tests for PortfolioRepository.
"""

import pytest

from app.repositories.portfolio_repository import PortfolioRepository


@pytest.mark.asyncio
async def test_portfolio_repository_initialization():
    """Test PortfolioRepository can be initialized with a session."""

    # Create a mock-like object
    class MockSession:
        pass

    repo = PortfolioRepository(MockSession())
    assert repo is not None
    assert hasattr(repo, "get_user_portfolio")
    assert hasattr(repo, "get_account_current_balance")


@pytest.mark.asyncio
async def test_get_user_portfolio_exists():
    """Test get_user_portfolio method exists."""

    class MockSession:
        pass

    repo = PortfolioRepository(MockSession())
    assert callable(repo.get_user_portfolio)


@pytest.mark.asyncio
async def test_get_account_current_balance_exists():
    """Test get_account_current_balance method exists."""

    class MockSession:
        pass

    repo = PortfolioRepository(MockSession())
    assert callable(repo.get_account_current_balance)
