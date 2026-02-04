"""
Tests for user service.
"""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.user import UserRegistrationRequest
from app.services.user import UserService


@pytest.mark.asyncio
async def test_create_user(db_session: AsyncSession) -> None:
    """Test user creation."""
    user_service = UserService(db_session)
    user_data = UserRegistrationRequest(
        email="test@example.com",
        username="testuser",
        password="TestPass123",
        full_name="Test User",
    )

    user = await user_service.create_user(user_data)

    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.username == "testuser"
    assert user.full_name == "Test User"
    assert user.is_active is True
    assert user.is_verified is False


@pytest.mark.asyncio
async def test_create_duplicate_email(db_session: AsyncSession) -> None:
    """Test that creating a user with duplicate email raises ValueError."""
    user_service = UserService(db_session)
    user_data = UserRegistrationRequest(
        email="duplicate@example.com",
        username="user1",
        password="TestPass123",
    )

    await user_service.create_user(user_data)

    # Try to create another user with same email
    duplicate_data = UserRegistrationRequest(
        email="duplicate@example.com",
        username="user2",
        password="TestPass123",
    )

    with pytest.raises(ValueError, match="User with this email already exists"):
        await user_service.create_user(duplicate_data)


@pytest.mark.asyncio
async def test_create_duplicate_username(db_session: AsyncSession) -> None:
    """Test that creating a user with duplicate username raises ValueError."""
    user_service = UserService(db_session)
    user_data = UserRegistrationRequest(
        email="user1@example.com",
        username="duplicate",
        password="TestPass123",
    )

    await user_service.create_user(user_data)

    # Try to create another user with same username
    duplicate_data = UserRegistrationRequest(
        email="user2@example.com",
        username="duplicate",
        password="TestPass123",
    )

    with pytest.raises(ValueError, match="User with this username already exists"):
        await user_service.create_user(duplicate_data)


@pytest.mark.asyncio
async def test_get_user_by_email(db_session: AsyncSession) -> None:
    """Test retrieving user by email."""
    user_service = UserService(db_session)
    user_data = UserRegistrationRequest(
        email="find@example.com",
        username="findme",
        password="TestPass123",
    )

    created_user = await user_service.create_user(user_data)
    found_user = await user_service.get_user_by_email("find@example.com")

    assert found_user is not None
    assert found_user.id == created_user.id
    assert found_user.email == "find@example.com"


@pytest.mark.asyncio
async def test_get_user_by_username(db_session: AsyncSession) -> None:
    """Test retrieving user by username."""
    user_service = UserService(db_session)
    user_data = UserRegistrationRequest(
        email="user@example.com",
        username="finduser",
        password="TestPass123",
    )

    created_user = await user_service.create_user(user_data)
    found_user = await user_service.get_user_by_username("finduser")

    assert found_user is not None
    assert found_user.id == created_user.id
    assert found_user.username == "finduser"


@pytest.mark.asyncio
async def test_authenticate_user_success(db_session: AsyncSession) -> None:
    """Test successful user authentication."""
    user_service = UserService(db_session)
    user_data = UserRegistrationRequest(
        email="auth@example.com",
        username="authuser",
        password="TestPass123",
    )

    await user_service.create_user(user_data)
    authenticated_user = await user_service.authenticate_user("authuser", "TestPass123")

    assert authenticated_user is not None
    assert authenticated_user.username == "authuser"


@pytest.mark.asyncio
async def test_authenticate_user_wrong_password(db_session: AsyncSession) -> None:
    """Test authentication with wrong password."""
    user_service = UserService(db_session)
    user_data = UserRegistrationRequest(
        email="auth@example.com",
        username="authuser",
        password="TestPass123",
    )

    await user_service.create_user(user_data)
    authenticated_user = await user_service.authenticate_user("authuser", "WrongPass123")

    assert authenticated_user is None


@pytest.mark.asyncio
async def test_authenticate_nonexistent_user(db_session: AsyncSession) -> None:
    """Test authentication with nonexistent user."""
    user_service = UserService(db_session)
    authenticated_user = await user_service.authenticate_user("nonexistent", "TestPass123")

    assert authenticated_user is None

@pytest.mark.asyncio
async def test_get_user_by_id(db_session: AsyncSession) -> None:
    """Test retrieving user by ID."""
    user_service = UserService(db_session)
    user_data = UserRegistrationRequest(
        email="byid@example.com",
        username="byiduser",
        password="TestPass123",
    )

    created_user = await user_service.create_user(user_data)
    found_user = await user_service.get_user_by_id(created_user.id)

    assert found_user is not None
    assert found_user.id == created_user.id
