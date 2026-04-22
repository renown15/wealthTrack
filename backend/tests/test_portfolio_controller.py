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
    assert isinstance(data, dict)
    assert set(data.keys()) >= {"items", "totalValue", "accountCount"}


@pytest.mark.asyncio
async def test_get_portfolio_unauthorized(client: AsyncClient):
    """Test retrieving portfolio without authentication."""
    response = await client.get(
        "/api/v1/portfolio",
    )
    assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.asyncio
async def test_get_portfolio_empty(client, authenticated_headers: dict):
    """Test retrieving portfolio with no accounts."""
    response = await client.get(
        "/api/v1/portfolio",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, dict)
    assert data["items"] == []


@pytest.mark.asyncio
async def test_get_portfolio_with_accounts(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    account,
):
    """Test retrieving portfolio with accounts."""
    response = await client.get(
        "/api/v1/portfolio",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, dict)
    assert len(data["items"]) > 0
    assert data["accountCount"] >= 1


@pytest.mark.asyncio
async def test_get_portfolio_with_balance(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    account,
):
    """Test retrieving portfolio with account that has a balance event."""
    # First create a balance event
    await client.post(
        f"/api/v1/accounts/{account.id}/events",
        headers=authenticated_headers,
        json={"event_type": "balance", "value": "1000.00"},
    )

    response = await client.get(
        "/api/v1/portfolio",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) > 0
    # Check the account has a latest balance
    item = data["items"][0]
    assert item["latestBalance"] is not None
    assert item["latestBalance"]["value"] == "1000.00"
