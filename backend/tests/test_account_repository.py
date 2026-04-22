"""
Tests for AccountRepository.
"""
import pytest

from app.repositories.account_repository import AccountRepository


@pytest.mark.asyncio
async def test_account_repository_initialization():
    """Test AccountRepository can be initialized."""

    class MockSession:
        pass

    repo = AccountRepository(MockSession())
    assert repo is not None
    assert hasattr(repo, "get_by_id")
    assert hasattr(repo, "get_by_user")
    assert hasattr(repo, "get_by_institution")


@pytest.mark.asyncio
async def test_get_by_id_is_callable():
    """Test get_by_id method exists and is callable."""

    class MockSession:
        pass

    repo = AccountRepository(MockSession())
    assert callable(repo.get_by_id)


@pytest.mark.asyncio
async def test_get_by_user_is_callable():
    """Test get_by_user method exists and is callable."""

    class MockSession:
        pass

    repo = AccountRepository(MockSession())
    assert callable(repo.get_by_user)


@pytest.mark.asyncio
async def test_get_by_institution_is_callable():
    """Test get_by_institution method exists and is callable."""

    class MockSession:
        pass

    repo = AccountRepository(MockSession())
    assert callable(repo.get_by_institution)
