"""Tests for error handling coverage across controllers and services."""

import pytest
from fastapi import status
from httpx import AsyncClient

from app.models.account import Account
from app.models.institution import Institution
from app.models.user_profile import UserProfile


@pytest.mark.asyncio
async def test_create_account_invalid_institution(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    user: UserProfile,
):
    """Test creating account with invalid institution (FK constraint)."""
    payload = {
        "institutionId": 99999,  # Non-existent institution
        "name": "Invalid Account",
        "typeId": 1,
        "statusId": 1,
    }
    response = await client.post(
        "/api/v1/accounts",
        json=payload,
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_create_account_invalid_type(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    institution: Institution,
):
    """Test creating account with invalid type reference."""
    payload = {
        "institutionId": institution.id,
        "name": "Invalid Type Account",
        "typeId": 99999,  # Non-existent type
        "statusId": 1,
    }
    response = await client.post(
        "/api/v1/accounts",
        json=payload,
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_create_account_invalid_status(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    institution: Institution,
):
    """Test creating account with invalid status reference."""
    payload = {
        "institutionId": institution.id,
        "name": "Invalid Status Account",
        "typeId": 1,
        "statusId": 99999,  # Non-existent status
    }
    response = await client.post(
        "/api/v1/accounts",
        json=payload,
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_update_account_unauthorized(
    client: AsyncClient,
    account: Account,
):
    """Test updating account without authentication."""
    payload = {"name": "Updated Name"}
    response = await client.put(
        f"/api/v1/accounts/{account.id}",
        json=payload,
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_delete_account_unauthorized(
    client: AsyncClient,
    account: Account,
):
    """Test deleting account without authentication."""
    response = await client.delete(
        f"/api/v1/accounts/{account.id}",
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_get_account_unauthorized(
    client: AsyncClient,
    account: Account,
):
    """Test getting account without authentication."""
    response = await client.get(
        f"/api/v1/accounts/{account.id}",
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_list_accounts_unauthorized(
    client: AsyncClient,
):
    """Test listing accounts without authentication."""
    response = await client.get(
        "/api/v1/accounts",
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
