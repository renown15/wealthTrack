"""Tests for tax return upsert and document endpoints."""
from datetime import date, datetime
from io import BytesIO

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


async def _setup(
    db: AsyncSession, user: UserProfile
) -> tuple[Account, TaxPeriod]:
    type_id = await _get_ref_id(db, "account_type", "Savings Account")
    status_id = await _get_ref_id(db, "account_status", "Active")
    ir_attr_id = await _get_ref_id(db, "account_attribute_type", "Interest Rate")

    account = Account(user_id=user.id, name="Savings", type_id=type_id, status_id=status_id)
    db.add(account)
    await db.flush()
    attr = AccountAttribute(
        user_id=user.id, account_id=account.id, type_id=ir_attr_id, value="2.0"
    )
    db.add(attr)

    now = datetime.utcnow()
    period = TaxPeriod()
    period.user_id = user.id
    period.name = "2024/25"
    period.start_date = date(2024, 4, 6)
    period.end_date = date(2025, 4, 5)
    period.created_at = period.updated_at = now
    db.add(period)
    await db.flush()
    await db.refresh(account)
    await db.refresh(period)
    return account, period


@pytest.mark.asyncio
async def test_upsert_tax_return(
    client: AsyncClient, authenticated_headers: dict,
    db_session: AsyncSession, user: UserProfile,
) -> None:
    account, period = await _setup(db_session, user)
    await db_session.commit()
    payload = {"income": 150.00, "capitalGain": None, "taxTakenOff": 30.00}
    response = await client.put(
        f"/api/v1/tax/periods/{period.id}/accounts/{account.id}/return",
        json=payload, headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    assert float(response.json()["income"]) == 150.0
    assert float(response.json()["taxTakenOff"]) == 30.0


@pytest.mark.asyncio
async def test_upsert_tax_return_updates_existing(
    client: AsyncClient, authenticated_headers: dict,
    db_session: AsyncSession, user: UserProfile,
) -> None:
    account, period = await _setup(db_session, user)
    await db_session.commit()
    url = f"/api/v1/tax/periods/{period.id}/accounts/{account.id}/return"
    await client.put(url, json={"income": 100.0, "capitalGain": None, "taxTakenOff": 20.0}, headers=authenticated_headers)
    response = await client.put(url, json={"income": 200.0, "capitalGain": None, "taxTakenOff": 40.0}, headers=authenticated_headers)
    assert response.status_code == status.HTTP_200_OK
    assert float(response.json()["income"]) == 200.0


@pytest.mark.asyncio
async def test_upsert_tax_return_period_not_found(
    client: AsyncClient, authenticated_headers: dict,
    db_session: AsyncSession, user: UserProfile,
) -> None:
    account, _ = await _setup(db_session, user)
    await db_session.commit()
    response = await client.put(
        f"/api/v1/tax/periods/99999/accounts/{account.id}/return",
        json={"income": 10.0, "capitalGain": None, "taxTakenOff": None},
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_list_documents_empty(
    client: AsyncClient, authenticated_headers: dict,
    db_session: AsyncSession, user: UserProfile,
) -> None:
    account, period = await _setup(db_session, user)
    await db_session.commit()
    response = await client.get(
        f"/api/v1/tax/periods/{period.id}/accounts/{account.id}/documents",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


@pytest.mark.asyncio
async def test_upload_and_list_document(
    client: AsyncClient, authenticated_headers: dict,
    db_session: AsyncSession, user: UserProfile,
) -> None:
    account, period = await _setup(db_session, user)
    await db_session.commit()
    file_content = b"%PDF-1.4 fake"
    files = {"file": ("certificate.pdf", BytesIO(file_content), "application/pdf")}
    upload_resp = await client.post(
        f"/api/v1/tax/periods/{period.id}/accounts/{account.id}/documents",
        files=files, headers=authenticated_headers,
    )
    assert upload_resp.status_code == status.HTTP_201_CREATED
    doc_id = upload_resp.json()["id"]
    assert upload_resp.json()["filename"] == "certificate.pdf"
    list_resp = await client.get(
        f"/api/v1/tax/periods/{period.id}/accounts/{account.id}/documents",
        headers=authenticated_headers,
    )
    assert len(list_resp.json()) == 1
    assert list_resp.json()[0]["id"] == doc_id


@pytest.mark.asyncio
async def test_download_document(
    client: AsyncClient, authenticated_headers: dict,
    db_session: AsyncSession, user: UserProfile,
) -> None:
    account, period = await _setup(db_session, user)
    await db_session.commit()
    file_content = b"PDF content here"
    files = {"file": ("tax.pdf", BytesIO(file_content), "application/pdf")}
    upload_resp = await client.post(
        f"/api/v1/tax/periods/{period.id}/accounts/{account.id}/documents",
        files=files, headers=authenticated_headers,
    )
    doc_id = upload_resp.json()["id"]
    download_resp = await client.get(
        f"/api/v1/tax/documents/{doc_id}/download", headers=authenticated_headers
    )
    assert download_resp.status_code == status.HTTP_200_OK
    assert download_resp.content == file_content


@pytest.mark.asyncio
async def test_delete_document(
    client: AsyncClient, authenticated_headers: dict,
    db_session: AsyncSession, user: UserProfile,
) -> None:
    account, period = await _setup(db_session, user)
    await db_session.commit()
    files = {"file": ("doc.pdf", BytesIO(b"data"), "application/pdf")}
    upload_resp = await client.post(
        f"/api/v1/tax/periods/{period.id}/accounts/{account.id}/documents",
        files=files, headers=authenticated_headers,
    )
    doc_id = upload_resp.json()["id"]
    del_resp = await client.delete(f"/api/v1/tax/documents/{doc_id}", headers=authenticated_headers)
    assert del_resp.status_code == status.HTTP_204_NO_CONTENT
    list_resp = await client.get(
        f"/api/v1/tax/periods/{period.id}/accounts/{account.id}/documents",
        headers=authenticated_headers,
    )
    assert list_resp.json() == []


@pytest.mark.asyncio
async def test_delete_document_not_found(
    client: AsyncClient, authenticated_headers: dict
) -> None:
    response = await client.delete("/api/v1/tax/documents/99999", headers=authenticated_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
