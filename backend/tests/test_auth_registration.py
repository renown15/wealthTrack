"""
Tests for user registration endpoints.
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
            "first_name": "New",
            "last_name": "User",
            "password": "SecurePass123",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["firstname"] == "New"
    assert data["surname"] == "User"
    assert data["is_active"] is True
    assert data["is_verified"] is False
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient) -> None:
    """Test registration with duplicate email fails."""
    user_data = {
        "email": "duplicate@example.com",
        "first_name": "User",
        "last_name": "One",
        "password": "SecurePass123",
    }

    response1 = await client.post("/api/v1/auth/register", json=user_data)
    assert response1.status_code == 201

    duplicate_data = {
        "email": "duplicate@example.com",
        "first_name": "User",
        "last_name": "Two",
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
            "first_name": "Test",
            "last_name": "User",
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
            "first_name": "Test",
            "last_name": "User",
            "password": "weak",
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_service_error(client: AsyncClient) -> None:
    """Test register with existing user."""
    response1 = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "existing@example.com",
            "first_name": "Existing",
            "last_name": "User",
            "password": "SecurePass123",
        },
    )
    assert response1.status_code == 201

    response2 = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "existing@example.com",
            "first_name": "Different",
            "last_name": "User",
            "password": "SecurePass123",
        },
    )
    assert response2.status_code == 400
    assert "email already exists" in response2.json()["detail"]
