"""Tests for institution controller."""

import pytest
from fastapi import status

from app.models.institution import Institution
from app.models.user import User


@pytest.mark.asyncio
async def test_get_all_institutions(
    client, authenticated_headers: dict, user: User, institution: Institution
):
    """Test retrieving all institutions for a user."""
    response = await client.get(
        "/api/v1/institutions",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["userid"] == user.id


@pytest.mark.asyncio
async def test_get_institution_by_id(
    client, authenticated_headers: dict, institution: Institution
):
    """Test retrieving a specific institution by ID."""
    response = await client.get(
        f"/api/v1/institutions/{institution.id}",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == institution.id
    assert data["name"] == institution.name


@pytest.mark.asyncio
async def test_get_institution_not_found(
    client, authenticated_headers: dict
):
    """Test retrieving a non-existent institution."""
    response = await client.get(
        "/api/v1/institutions/99999",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_create_institution(
    client, authenticated_headers: dict, user: User, user_profile  # noqa: F841
):
    """Test creating a new institution."""
    payload = {
        "name": "New Bank",
    }
    response = await client.post(
        "/api/v1/institutions",
        json=payload,
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "New Bank"
    assert data["userid"] == user.id


@pytest.mark.asyncio
async def test_create_institution_unauthorized(client):
    """Test creating an institution without authentication."""
    payload = {
        "name": "New Bank",
    }
    response = await client.post(
        "/api/v1/institutions",
        json=payload,
    )
    assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.asyncio
async def test_update_institution(
    client, authenticated_headers: dict, institution: Institution
):
    """Test updating an institution."""
    payload = {
        "name": "Updated Bank Name",
    }
    response = await client.put(
        f"/api/v1/institutions/{institution.id}",
        json=payload,
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Updated Bank Name"
    assert data["id"] == institution.id


@pytest.mark.asyncio
async def test_update_institution_not_found(
    client, authenticated_headers: dict
):
    """Test updating a non-existent institution."""
    payload = {"name": "Updated Name"}
    response = await client.put(
        "/api/v1/institutions/99999",
        json=payload,
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_delete_institution(
    client, authenticated_headers: dict, institution: Institution
):
    """Test deleting an institution."""
    institution_id = institution.id
    response = await client.delete(
        f"/api/v1/institutions/{institution_id}",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify institution is deleted
    response = await client.get(
        f"/api/v1/institutions/{institution_id}",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_delete_institution_not_found(
    client, authenticated_headers: dict
):
    """Test deleting a non-existent institution."""
    response = await client.delete(
        "/api/v1/institutions/99999",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_institution_list_empty(
    client, authenticated_headers: dict
):
    """Test retrieving institutions when none exist."""
    # This test verifies the list endpoint works with no institutions
    response = await client.get(
        "/api/v1/institutions",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
