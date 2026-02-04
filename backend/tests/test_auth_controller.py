"""
Tests for authentication endpoints.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient) -> None:
    """Test user registration endpoint."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "SecurePass123",
            "full_name": "New User",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["username"] == "newuser"
    assert data["full_name"] == "New User"
    assert data["is_active"] is True
    assert data["is_verified"] is False
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient) -> None:
    """Test registration with duplicate email fails."""
    user_data = {
        "email": "duplicate@example.com",
        "username": "user1",
        "password": "SecurePass123",
    }

    # First registration succeeds
    response1 = await client.post("/api/v1/auth/register", json=user_data)
    assert response1.status_code == 201

    # Second registration with same email fails
    duplicate_data = {
        "email": "duplicate@example.com",
        "username": "user2",
        "password": "SecurePass123",
    }
    response2 = await client.post("/api/v1/auth/register", json=duplicate_data)
    assert response2.status_code == 400
    assert "email already exists" in response2.json()["detail"]


@pytest.mark.asyncio
async def test_register_invalid_email(client: AsyncClient) -> None:
    """Test registration with invalid email fails."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "not-an-email",
            "username": "testuser",
            "password": "SecurePass123",
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_weak_password(client: AsyncClient) -> None:
    """Test registration with weak password fails."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "user@example.com",
            "username": "testuser",
            "password": "weak",
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient) -> None:
    """Test successful login."""
    # First, register a user
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "login@example.com",
            "username": "loginuser",
            "password": "SecurePass123",
        },
    )

    # Then login
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "username": "loginuser",
            "password": "SecurePass123",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient) -> None:
    """Test login with wrong password fails."""
    # Register a user
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "user@example.com",
            "username": "testuser",
            "password": "SecurePass123",
        },
    )

    # Try to login with wrong password
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "username": "testuser",
            "password": "WrongPass123",
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient) -> None:
    """Test login with nonexistent user fails."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "username": "nonexistent",
            "password": "SecurePass123",
        },
    )

    assert response.status_code == 401

@pytest.mark.asyncio
async def test_register_duplicate_username(client: AsyncClient) -> None:
    """Test registration with duplicate username fails."""
    user_data = {
        "email": "user1@example.com",
        "username": "duplicateuser",
        "password": "SecurePass123",
    }

    # First registration succeeds
    response1 = await client.post("/api/v1/auth/register", json=user_data)
    assert response1.status_code == 201

    # Second registration with same username fails
    duplicate_data = {
        "email": "user2@example.com",
        "username": "duplicateuser",
        "password": "SecurePass123",
    }
    response2 = await client.post("/api/v1/auth/register", json=duplicate_data)
    assert response2.status_code == 400
    assert "username already exists" in response2.json()["detail"]


@pytest.mark.asyncio
async def test_register_service_error(client: AsyncClient) -> None:
    """Test register with existing user."""
    # Register first user
    response1 = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "existing@example.com",
            "username": "existing",
            "password": "SecurePass123",
        },
    )
    assert response1.status_code == 201

    # Try to register with same username triggers ValueError
    response2 = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "different@example.com",
            "username": "existing",
            "password": "SecurePass123",
        },
    )
    assert response2.status_code == 400
    assert "username already exists" in response2.json()["detail"]


@pytest.mark.asyncio
async def test_get_current_user_success(client: AsyncClient) -> None:
    """Test getting current user with valid JWT."""
    # Register and login
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "current@example.com",
            "username": "currentuser",
            "password": "SecurePass123",
        },
    )

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "username": "currentuser",
            "password": "SecurePass123",
        },
    )
    token = login_response.json()["access_token"]

    # Get current user
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "currentuser"
    assert data["email"] == "current@example.com"
