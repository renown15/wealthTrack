"""
Tests for InstitutionRepository.
"""
import pytest

from app.repositories.institution_repository import InstitutionRepository


@pytest.mark.asyncio
async def test_institution_repository_initialization():
    """Test InstitutionRepository can be initialized."""
    class MockSession:
        pass

    repo = InstitutionRepository(MockSession())
    assert repo is not None
    assert hasattr(repo, "get_by_id")
    assert hasattr(repo, "get_by_user")


@pytest.mark.asyncio
async def test_get_by_id_is_callable():
    """Test get_by_id method exists and is callable."""
    class MockSession:
        pass

    repo = InstitutionRepository(MockSession())
    assert callable(repo.get_by_id)


@pytest.mark.asyncio
async def test_get_by_user_is_callable():
    """Test get_by_user method exists and is callable."""
    class MockSession:
        pass

    repo = InstitutionRepository(MockSession())
    assert callable(repo.get_by_user)
