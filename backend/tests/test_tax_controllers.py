"""Tests for tax period CRUD and eligible accounts endpoints."""
from datetime import date, datetime

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.account_attribute import AccountAttribute
from app.models.reference_data import ReferenceData
from app.models.tax_period import TaxPeriod
from app.models.user_profile import UserProfile


async def _create_period(
    db: AsyncSession,
    user: UserProfile,
    start: date = date(2024, 4, 6),
    end: date = date(2025, 4, 5),
) -> TaxPeriod:
    now = datetime.utcnow()
    p = TaxPeriod()
    p.user_id = user.id
    p.name = "2024/25"
    p.start_date = start
    p.end_date = end
    p.created_at = p.updated_at = now
    db.add(p)
    await db.flush()
    await db.refresh(p)
    return p


async def _get_ref_id(db: AsyncSession, class_key: str, value: str) -> int:
    result = await db.execute(
        select(ReferenceData.id).where(
            ReferenceData.class_key == class_key,
            ReferenceData.reference_value == value,
        )
    )
    row = result.scalar_one_or_none()
    if row is not None:
        return row
    ref = ReferenceData(class_key=class_key, reference_value=value, sort_index=99)
    db.add(ref)
    await db.flush()
    await db.refresh(ref)
    return ref.id


async def _savings_account(db: AsyncSession, user: UserProfile) -> Account:
    type_id = await _get_ref_id(db, "account_type", "Savings Account")
    status_id = await _get_ref_id(db, "account_status", "Active")
    ir_attr_id = await _get_ref_id(db, "account_attribute_type", "Interest Rate")

    account = Account(user_id=user.id, name="My Savings", type_id=type_id, status_id=status_id)
    db.add(account)
    await db.flush()
    attr = AccountAttribute(user_id=user.id, account_id=account.id, type_id=ir_attr_id, value="2.0")
    db.add(attr)
    await db.flush()
    await db.refresh(account)
    return account


@pytest.mark.asyncio
async def test_list_periods_empty(client: AsyncClient, authenticated_headers: dict) -> None:
    response = await client.get("/api/v1/tax/periods", headers=authenticated_headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_period(client: AsyncClient, authenticated_headers: dict) -> None:
    payload = {"name": "2024/25", "startDate": "2024-04-06", "endDate": "2025-04-05"}
    response = await client.post("/api/v1/tax/periods", json=payload, headers=authenticated_headers)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "2024/25"
    assert data["startDate"] == "2024-04-06"


@pytest.mark.asyncio
async def test_create_period_invalid_dates(
    client: AsyncClient, authenticated_headers: dict
) -> None:
    payload = {"name": "Bad", "startDate": "2025-04-05", "endDate": "2024-04-06"}
    response = await client.post("/api/v1/tax/periods", json=payload, headers=authenticated_headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
async def test_list_periods_returns_created(
    client: AsyncClient,
    authenticated_headers: dict,
    db_session: AsyncSession,
    user: UserProfile,
) -> None:
    await _create_period(db_session, user)
    await db_session.commit()
    response = await client.get("/api/v1/tax/periods", headers=authenticated_headers)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1


@pytest.mark.asyncio
async def test_delete_period(
    client: AsyncClient,
    authenticated_headers: dict,
    db_session: AsyncSession,
    user: UserProfile,
) -> None:
    period = await _create_period(db_session, user)
    await db_session.commit()
    response = await client.delete(
        f"/api/v1/tax/periods/{period.id}", headers=authenticated_headers
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    list_resp = await client.get("/api/v1/tax/periods", headers=authenticated_headers)
    assert list_resp.json() == []


@pytest.mark.asyncio
async def test_delete_period_not_found(client: AsyncClient, authenticated_headers: dict) -> None:
    response = await client.delete("/api/v1/tax/periods/99999", headers=authenticated_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_get_eligible_accounts_empty(
    client: AsyncClient,
    authenticated_headers: dict,
    db_session: AsyncSession,
    user: UserProfile,
) -> None:
    period = await _create_period(db_session, user)
    await db_session.commit()
    response = await client.get(
        f"/api/v1/tax/periods/{period.id}/accounts", headers=authenticated_headers
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["inScope"] == []
    assert data["eligible"] == []


@pytest.mark.asyncio
async def test_get_eligible_accounts_with_savings(
    client: AsyncClient,
    authenticated_headers: dict,
    db_session: AsyncSession,
    user: UserProfile,
) -> None:
    await _savings_account(db_session, user)
    period = await _create_period(db_session, user)
    await db_session.commit()
    response = await client.get(
        f"/api/v1/tax/periods/{period.id}/accounts", headers=authenticated_headers
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["eligible"]) == 1
    assert data["eligible"][0]["eligibilityReason"] == "interest_bearing"
