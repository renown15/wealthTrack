"""Tests for the hub-level tax document library endpoint."""
from datetime import date

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.tax_document import TaxDocument
from app.models.tax_period import TaxPeriod
from app.models.tax_return import TaxReturn
from app.models.user_profile import UserProfile


async def _make_doc(
    db: AsyncSession, user: UserProfile, account: Account, period_name: str, filename: str
) -> TaxDocument:
    year = 2024 if period_name == "2024/25" else 2025
    period = TaxPeriod(user_id=user.id, name=period_name,
                       start_date=date(year, 4, 6), end_date=date(year + 1, 4, 5))
    db.add(period)
    await db.flush()
    tax_return = TaxReturn(user_id=user.id, account_id=account.id, tax_period_id=period.id)
    db.add(tax_return)
    await db.flush()
    doc = TaxDocument(user_id=user.id, tax_return_id=tax_return.id,
                      filename=filename, description="cert", content_type="application/pdf",
                      file_data=b"pdf-bytes")
    db.add(doc)
    await db.flush()
    return doc


@pytest.mark.asyncio
async def test_library_lists_documents_with_labels(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    db_session: AsyncSession,
    user: UserProfile,
    account: Account,
):
    """The library returns every document with its account and period names."""
    await _make_doc(db_session, user, account, "2024/25", "old-cert.pdf")
    await _make_doc(db_session, user, account, "2025/26", "new-cert.pdf")
    await db_session.commit()

    response = await client.get("/api/v1/tax/documents", headers=authenticated_headers)
    assert response.status_code == status.HTTP_200_OK
    docs = response.json()
    assert len(docs) == 2
    # Newest period first; labels present; no file bytes in the payload
    assert docs[0]["filename"] == "new-cert.pdf"
    assert docs[0]["periodName"] == "2025/26"
    assert docs[0]["accountName"] == account.name
    assert docs[1]["periodName"] == "2024/25"
    assert "fileData" not in docs[0]


@pytest.mark.asyncio
async def test_library_empty_without_documents(
    client: AsyncClient, authenticated_headers: dict[str, str]
):
    """No documents means an empty library, not an error."""
    response = await client.get("/api/v1/tax/documents", headers=authenticated_headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


@pytest.mark.asyncio
async def test_upload_top_level_document(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    db_session: AsyncSession,
    user: UserProfile,
    account: Account,
):
    """A library upload has no return: — labels, sorted first, still downloadable."""
    await _make_doc(db_session, user, account, "2025/26", "account-cert.pdf")
    await db_session.commit()

    response = await client.post(
        "/api/v1/tax/documents",
        headers=authenticated_headers,
        files={"file": ("SA100 2019-20.pdf", b"archived return", "application/pdf")},
        data={"description": "archived return"},
    )
    assert response.status_code == status.HTTP_201_CREATED
    created = response.json()
    assert created["taxReturnId"] is None
    assert created["accountName"] is None

    library = (
        await client.get("/api/v1/tax/documents", headers=authenticated_headers)
    ).json()
    assert [d["filename"] for d in library] == ["SA100 2019-20.pdf", "account-cert.pdf"]
    assert library[0]["periodName"] is None

    download = await client.get(
        f"/api/v1/tax/documents/{created['id']}/download", headers=authenticated_headers
    )
    assert download.status_code == status.HTTP_200_OK
    assert download.content == b"archived return"


@pytest.mark.asyncio
async def test_top_level_document_invisible_to_account_views(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    db_session: AsyncSession,
    user: UserProfile,
    account: Account,
):
    """Library docs never leak into per-account document lists (or briefings)."""
    doc = await _make_doc(db_session, user, account, "2024/25", "cert.pdf")
    await db_session.commit()

    await client.post(
        "/api/v1/tax/documents",
        headers=authenticated_headers,
        files={"file": ("standalone.pdf", b"x", "application/pdf")},
    )

    # The per-account listing for the period still only sees the account's doc.
    tax_return = await db_session.get(TaxReturn, doc.tax_return_id)
    assert tax_return is not None
    per_account = (
        await client.get(
            f"/api/v1/tax/periods/{tax_return.tax_period_id}/accounts/{account.id}/documents",
            headers=authenticated_headers,
        )
    ).json()
    assert [d["filename"] for d in per_account] == ["cert.pdf"]
