"""Tests for credentials service error handling."""
import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.institution import Institution
from app.models.reference_data import ReferenceData


@pytest.mark.asyncio
async def test_create_credential_invalid_institution(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    db_session: AsyncSession,
) -> None:
    """Test creating credential for non-existent institution."""
    type_stmt = select(ReferenceData).where(ReferenceData.class_key == "credential_type")
    type_result = await db_session.execute(type_stmt)
    credential_type = type_result.scalars().first()

    response = await client.post(
        "/api/v1/institutions/99999/credentials",
        json={
            "typeId": credential_type.id,
            "key": "username",
            "value": "test",
        },
        headers=authenticated_headers,
    )
    # Returns 400 when institution not found
    assert response.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND)


@pytest.mark.asyncio
async def test_create_credential_invalid_type(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    institution: Institution,
) -> None:
    """Test creating credential with invalid credential type."""
    response = await client.post(
        f"/api/v1/institutions/{institution.id}/credentials",
        json={
            "typeId": 99999,
            "key": "username",
            "value": "test",
        },
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_update_credential_not_found(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    db_session: AsyncSession,
    institution: Institution,
) -> None:
    """Test updating non-existent credential."""
    type_stmt = select(ReferenceData).where(ReferenceData.class_key == "credential_type")
    type_result = await db_session.execute(type_stmt)
    credential_type = type_result.scalars().first()

    response = await client.put(
        f"/api/v1/institutions/{institution.id}/credentials/99999",
        json={
            "typeId": credential_type.id,
            "value": "newvalue",
        },
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_delete_credential_not_found(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    institution: Institution,
) -> None:
    """Test deleting non-existent credential."""
    response = await client.delete(
        f"/api/v1/institutions/{institution.id}/credentials/99999",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
