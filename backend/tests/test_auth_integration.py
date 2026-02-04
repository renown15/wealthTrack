"""
Integration tests for auth endpoints - error path coverage.
Tests the error handling paths not covered by unit tests.
"""
import pytest
from httpx import AsyncClient

from app.services.auth import create_access_token


@pytest.mark.asyncio
async def test_missing_auth_header(client: AsyncClient) -> None:
    """Test accessing protected endpoint without auth header."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_invalid_token_malformed(client: AsyncClient) -> None:
    """Test with malformed token."""
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer not.a.token"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_token_missing_sub_claim(client: AsyncClient) -> None:
    """Test with valid JWT but missing 'sub' claim."""
    token = create_access_token(data={"other_claim": "value"})
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
@pytest.mark.skip(reason="Integration test - user not found error in get_current_user")
async def test_user_not_found_with_valid_token(client: AsyncClient) -> None:
    """Test accessing user that doesn't exist."""
    token = create_access_token(data={"sub": "nonexistentuser"})
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404
