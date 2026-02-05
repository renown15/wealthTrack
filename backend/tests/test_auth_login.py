"""
Tests for user login and authentication endpoints.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient) -> None:
    """Test successful login."""
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "login@example.com",
            "first_name": "Login",
            "last_name": "User",
            "password": "SecurePass123",
        },
    )

    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "login@example.com",
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
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "user@example.com",
            "first_name": "Test",
            "last_name": "User",
            "password": "SecurePass123",
        },
    )

    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "user@example.com",
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
            "email": "nonexistent@example.com",
            "password": "SecurePass123",
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_success(client: AsyncClient) -> None:
    """Test getting current user with valid JWT."""
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "current@example.com",
            "first_name": "Current",
            "last_name": "User",
            "password": "SecurePass123",
        },
    )

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "current@example.com",
            "password": "SecurePass123",
        },
    )
    token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "current@example.com"
    assert data["firstname"] == "Current"
    assert data["surname"] == "User"
