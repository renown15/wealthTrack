"""
Tests for InstitutionRepository.
"""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.institution import Institution
from app.models.reference_data import ReferenceData
from app.models.user_profile import UserProfile
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


@pytest.mark.asyncio
async def test_get_by_user_ids_empty_list():
    """get_by_user_ids returns empty list when no user IDs provided."""

    class MockSession:
        pass

    repo = InstitutionRepository(MockSession())
    result = await repo.get_by_user_ids([])
    assert result == []


@pytest.mark.asyncio
async def test_get_by_user_ids_integration(db_session: AsyncSession, user: UserProfile):
    """get_by_user_ids returns institutions for multiple users."""
    from sqlalchemy import select

    result = await db_session.execute(
        select(ReferenceData).where(
            ReferenceData.class_key == "user_type", ReferenceData.reference_value == "User"
        )
    )
    user_type = result.scalar_one()
    other = UserProfile(first_name="Other", last_name="User", email="other2@example.com",
                        password="hashed", is_active=True, type_id=user_type.id)
    db_session.add(other)
    await db_session.flush()
    inst1 = Institution(user_id=user.id, name="Bank A")
    inst2 = Institution(user_id=other.id, name="Bank B")
    db_session.add_all([inst1, inst2])
    await db_session.flush()
    repo = InstitutionRepository(db_session)
    results = await repo.get_by_user_ids([user.id, other.id])
    names = {i.name for i in results}
    assert "Bank A" in names
    assert "Bank B" in names
