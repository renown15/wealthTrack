"""Tests for portfolio controller."""

import pytest
from fastapi import status
from httpx import AsyncClient

from app.models.user_profile import UserProfile


@pytest.mark.asyncio
async def test_get_portfolio(
    client: AsyncClient, authenticated_headers: dict[str, str], user: UserProfile
):
    """Test retrieving user's portfolio."""
    response = await client.get(
        "/api/v1/portfolio",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_portfolio_unauthorized(client: AsyncClient):
    """Test retrieving portfolio without authentication."""
    response = await client.get(
        "/api/v1/portfolio",
    )
    assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.asyncio
async def test_get_portfolio_empty(
    client, authenticated_headers: dict
):
    """Test retrieving portfolio with no accounts."""
    response = await client.get(
        "/api/v1/portfolio",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
