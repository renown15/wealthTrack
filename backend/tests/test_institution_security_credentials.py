"""Tests for institution credential management."""

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.institution import Institution
from app.models.institution_security_credentials import InstitutionSecurityCredentials
from app.models.reference_data import ReferenceData
from app.models.user_profile import UserProfile


@pytest.mark.asyncio
async def test_list_institution_credentials(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    db_session: AsyncSession,
    institution: Institution,
    user: UserProfile,
) -> None:
    """Ensure credentials are listed for an institution."""
    type_stmt = select(ReferenceData).where(
        ReferenceData.class_key == "credential_type"
    )
    type_result = await db_session.execute(type_stmt)
    credential_type = type_result.scalars().first()
    assert credential_type is not None

    credential = InstitutionSecurityCredentials(
        user_id=user.id,
        institution_id=institution.id,
        type_id=credential_type.id,
        key="login",
        value="secret",
    )
    db_session.add(credential)
    await db_session.flush()

    response = await client.get(
        f"/api/v1/institutions/{institution.id}/credentials",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    payload: list[dict[str, object]] = response.json()
    assert isinstance(payload, list)
    assert payload
    first: dict[str, object] = payload[0]
    assert first["typeLabel"] == credential_type.reference_value
    assert first["key"] == "login"


@pytest.mark.asyncio
async def test_create_institution_credential(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    db_session: AsyncSession,
    institution: Institution,
    user: UserProfile,
) -> None:
    """Create a credential through the API."""
    type_stmt = select(ReferenceData).where(
        ReferenceData.class_key == "credential_type"
    )
    type_result = await db_session.execute(type_stmt)
    credential_type = type_result.scalars().first()
    assert credential_type is not None

    response = await client.post(
        f"/api/v1/institutions/{institution.id}/credentials",
        json={
            "typeId": credential_type.id,
            "key": "username",
            "value": "test-user",
        },
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["typeLabel"] == credential_type.reference_value
    assert data["key"] == "username"

    credential_stmt = select(InstitutionSecurityCredentials).where(
        InstitutionSecurityCredentials.id == data["id"]
    )
    result = await db_session.execute(credential_stmt)
    stored = result.scalar_one_or_none()
    assert stored
    assert stored.value == "test-user"


@pytest.mark.asyncio
async def test_update_institution_credential(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    db_session: AsyncSession,
    institution: Institution,
    user: UserProfile,
) -> None:
    """Update a credential value and type."""
    select_stmt = select(ReferenceData).where(
        ReferenceData.class_key == "credential_type"
    )
    type_result = await db_session.execute(select_stmt)
    credential_types = type_result.scalars().all()
    assert len(credential_types) >= 2

    credential = InstitutionSecurityCredentials(
        user_id=user.id,
        institution_id=institution.id,
        type_id=credential_types[0].id,
        key="pin",
        value="1234",
    )
    db_session.add(credential)
    await db_session.flush()

    payload = {
        "typeId": credential_types[1].id,
        "value": "4321",
    }
    response = await client.put(
        f"/api/v1/institutions/{institution.id}/credentials/{credential.id}",
        json=payload,
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["typeId"] == credential_types[1].id
    assert data["value"] == "4321"
    assert data["typeLabel"] == credential_types[1].reference_value
