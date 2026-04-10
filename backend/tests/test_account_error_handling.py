"""Tests for account controller error handling."""
import pytest
from fastapi import status
from httpx import AsyncClient

from app.models.institution import Institution


@pytest.mark.asyncio
async def test_create_account_invalid_institution(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
) -> None:
    """Test creating account with non-existent institution."""
    payload = {
        "institutionId": 99999,
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
) -> None:
    """Test creating account with non-existent type."""
    payload = {
        "institutionId": institution.id,
        "name": "Invalid Account",
        "typeId": 99999,
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
) -> None:
    """Test creating account with non-existent status."""
    payload = {
        "institutionId": institution.id,
        "name": "Invalid Account",
        "typeId": 1,
        "statusId": 99999,
    }
    response = await client.post(
        "/api/v1/accounts",
        json=payload,
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_update_account_not_found(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
) -> None:
    """Test updating non-existent account."""
    payload = {"name": "Updated Name"}
    response = await client.put(
        "/api/v1/accounts/99999",
        json=payload,
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_delete_account_not_found(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
) -> None:
    """Test deleting non-existent account."""
    response = await client.delete(
        "/api/v1/accounts/99999",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
