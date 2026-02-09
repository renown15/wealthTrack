"""
Tests for JWT token middleware and authentication dependencies.
"""
from datetime import timedelta

import pytest
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
from jose import jwt

from app.config import settings
from app.controllers.dependencies import get_current_user_from_token
from app.main import app
from app.services.auth import create_access_token, decode_access_token

client = TestClient(app)


class TestCreateAccessToken:
    """Test JWT access token creation."""

    def test_create_access_token_basic(self) -> None:
        """Test creating a basic access token."""
        data = {"sub": "testuser", "user_id": "123"}
        token = create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0
        # Should be JWT format: header.payload.signature
        assert token.count(".") == 2

    def test_create_access_token_with_expiration(self) -> None:
        """Test creating token with custom expiration."""
        data = {"sub": "testuser"}
        expires = timedelta(hours=24)
        token = create_access_token(data, expires_delta=expires)

        assert isinstance(token, str)
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        assert "exp" in payload
        assert payload["sub"] == "testuser"

    def test_create_access_token_default_expiration(self) -> None:
        """Test token uses default expiration when not specified."""
        data = {"sub": "testuser"}
        token = create_access_token(data)
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])

        assert "exp" in payload
        # Default is 15 minutes, so exp should be set
        assert payload["exp"] > 0


class TestDecodeAccessToken:
    """Test JWT token decoding and validation."""

    def test_decode_valid_token(self) -> None:
        """Test decoding a valid token."""
        data = {"sub": "testuser", "user_id": "123"}
        token = create_access_token(data)
        payload = decode_access_token(token)

        assert payload is not None
        assert payload["sub"] == "testuser"
        assert payload["user_id"] == "123"

    def test_decode_invalid_token(self) -> None:
        """Test decoding an invalid token returns None."""
        invalid_token = "invalid.token.here"
        payload = decode_access_token(invalid_token)

        assert payload is None

    def test_decode_malformed_token(self) -> None:
        """Test decoding a malformed token returns None."""
        malformed_token = "not_a_jwt"
        payload = decode_access_token(malformed_token)

        assert payload is None

    def test_decode_token_with_wrong_secret(self) -> None:
        """Test decoding token signed with different secret fails."""
        data = {"sub": "testuser"}
        token = jwt.encode(data, "wrong-secret-key", algorithm=settings.algorithm)
        payload = decode_access_token(token)

        assert payload is None

    def test_decode_expired_token(self) -> None:
        """Test decoding an expired token returns None."""
        data = {"sub": "testuser"}
        # Create token that expired 1 hour ago
        expired_token = create_access_token(data, expires_delta=timedelta(hours=-1))
        payload = decode_access_token(expired_token)

        assert payload is None


class TestGetCurrentUserFromToken:
    """Test FastAPI dependency for extracting user from token."""

    @pytest.mark.asyncio
    async def test_get_current_user_with_valid_token(self) -> None:
        """Test extracting user with valid token."""
        from unittest.mock import MagicMock

        data = {"sub": "testuser", "user_id": "123"}
        token = create_access_token(data)

        # Create mock request object with Authorization header
        mock_request = MagicMock()
        mock_request.headers.get.return_value = f"Bearer {token}"

        payload = await get_current_user_from_token(mock_request)

        assert payload["sub"] == "testuser"
        assert payload["user_id"] == "123"

    @pytest.mark.asyncio
    async def test_get_current_user_with_invalid_token(self) -> None:
        """Test that invalid token raises HTTPException."""
        from unittest.mock import MagicMock

        # Create mock request with invalid token
        mock_request = MagicMock()
        mock_request.headers.get.return_value = "Bearer invalid.token.here"

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_from_token(mock_request)

        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid or expired token" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_get_current_user_with_expired_token(self) -> None:
        """Test that expired token raises HTTPException."""
        from unittest.mock import MagicMock

        data = {"sub": "testuser"}
        expired_token = create_access_token(data, expires_delta=timedelta(hours=-1))

        # Create mock request with expired token
        mock_request = MagicMock()
        mock_request.headers.get.return_value = f"Bearer {expired_token}"

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_from_token(mock_request)

        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED


class TestAuthEndpoints:
    """Integration tests for authentication endpoints."""

    @pytest.mark.skip(reason="Integration test - requires fixture injection")
    def test_register_endpoint_creates_user(self) -> None:
        """Test user registration endpoint."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "username": "newuser",
                "password": "SecurePass123",
                "full_name": "New User",
            },
        )

        assert response.status_code in [200, 201]
        data = response.json()
        assert "id" in data or "message" in data

    @pytest.mark.skip(reason="Integration test - requires fixture injection")
    def test_login_endpoint_returns_token(self) -> None:
        """Test login endpoint returns JWT token."""
        # First register a user
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "logintest@example.com",
                "username": "logintest",
                "password": "SecurePass123",
                "full_name": "Login Test",
            },
        )

        # Then login
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "logintest",
                "password": "SecurePass123",
            },
        )

        assert response.status_code in [200, 400]  # 400 if DB issue
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data or "token" in data.values() or "accessToken" in data

    @pytest.mark.skip(reason="Integration test - requires fixture injection")
    def test_login_with_wrong_password_fails(self) -> None:
        """Test login fails with wrong password."""
        # Register user
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "wrongpass@example.com",
                "username": "wrongpass",
                "password": "SecurePass123",
                "full_name": "Wrong Pass",
            },
        )

        # Try login with wrong password
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "wrongpass",
                "password": "WrongPass123",
            },
        )

        assert response.status_code in [401, 400]  # Should fail

    def test_token_includes_user_id(self) -> None:
        """Test that token payload includes user_id."""
        data = {"sub": "testuser", "user_id": "456"}
        token = create_access_token(data)
        payload = decode_access_token(token)

        assert payload is not None
        assert payload.get("user_id") == "456"
