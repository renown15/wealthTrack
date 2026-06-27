"""Tests for the tax-scope override (mark out of scope + note) feature."""
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
from app.services.tax_briefing_pdf import BriefingData, build_pdf
from app.services.tax_briefing_sections import out_of_scope_section


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


async def _setup(db: AsyncSession, user: UserProfile) -> tuple[Account, TaxPeriod]:
    type_id = await _get_ref_id(db, "account_type", "Savings Account")
    status_id = await _get_ref_id(db, "account_status", "Active")
    ir_attr_id = await _get_ref_id(db, "account_attribute_type", "Interest Rate")
    await _get_ref_id(db, "tax_scope_status", "Out of Scope")

    account = Account(user_id=user.id, name="Savings", type_id=type_id, status_id=status_id)
    db.add(account)
    await db.flush()
    db.add(AccountAttribute(
        user_id=user.id, account_id=account.id, type_id=ir_attr_id, value="2.0"))

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


# --------------------------------------------------------------------------
# PDF rendering — pure functions, no database
# --------------------------------------------------------------------------
def test_out_of_scope_section_empty_returns_nothing():
    assert out_of_scope_section({}, []) == []


def test_build_pdf_includes_out_of_scope_account():
    account = type("A", (), {"id": 9, "name": "Old Saver"})()
    tax_return = type("R", (), {"note": "Interest below threshold"})()
    item = {"account": account, "account_type": "Savings Account",
            "tax_return": tax_return, "scope": "Out of Scope", "documents": []}
    data = BriefingData(
        member_name="T", period_name="2024/25",
        portfolio_items=[], in_scope=[], eligible=[], gifts=[], out_of_scope=[item],
    )
    pdf = build_pdf(data)
    assert pdf[:5] == b"%PDF-"
    assert len(pdf) > 1000


# --------------------------------------------------------------------------
# Endpoint + categorisation — integration
# --------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_mark_out_of_scope_sets_scope_and_note(
    client: AsyncClient, authenticated_headers: dict,
    db_session: AsyncSession, user: UserProfile,
) -> None:
    account, period = await _setup(db_session, user)
    await db_session.commit()
    response = await client.put(
        f"/api/v1/tax/periods/{period.id}/accounts/{account.id}/scope",
        json={"scope": "Out of Scope", "note": "Below threshold"},
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["scope"] == "Out of Scope"
    assert body["note"] == "Below threshold"


@pytest.mark.asyncio
async def test_out_of_scope_account_moves_to_not_in_scope(
    client: AsyncClient, authenticated_headers: dict,
    db_session: AsyncSession, user: UserProfile,
) -> None:
    account, period = await _setup(db_session, user)
    await db_session.commit()
    accounts_url = f"/api/v1/tax/periods/{period.id}/accounts"
    before = (await client.get(accounts_url, headers=authenticated_headers)).json()
    assert any(a["accountId"] == account.id for a in before["eligible"])

    await client.put(
        f"/api/v1/tax/periods/{period.id}/accounts/{account.id}/scope",
        json={"scope": "Out of Scope", "note": "Excluded"},
        headers=authenticated_headers,
    )
    after = (await client.get(accounts_url, headers=authenticated_headers)).json()
    assert not any(a["accountId"] == account.id for a in after["eligible"])
    moved = next(a for a in after["notInScope"] if a["accountId"] == account.id)
    assert moved["taxReturn"]["scope"] == "Out of Scope"
    assert moved["taxReturn"]["note"] == "Excluded"


@pytest.mark.asyncio
async def test_clear_scope_returns_account_to_eligible(
    client: AsyncClient, authenticated_headers: dict,
    db_session: AsyncSession, user: UserProfile,
) -> None:
    account, period = await _setup(db_session, user)
    await db_session.commit()
    url = f"/api/v1/tax/periods/{period.id}/accounts/{account.id}/scope"
    await client.put(url, json={"scope": "Out of Scope", "note": "x"},
                     headers=authenticated_headers)
    cleared = await client.put(url, json={"scope": None, "note": None},
                               headers=authenticated_headers)
    assert cleared.status_code == status.HTTP_200_OK
    assert cleared.json()["scope"] is None

    after = (await client.get(
        f"/api/v1/tax/periods/{period.id}/accounts", headers=authenticated_headers)).json()
    assert any(a["accountId"] == account.id for a in after["eligible"])


@pytest.mark.asyncio
async def test_set_scope_unknown_value_is_rejected(
    client: AsyncClient, authenticated_headers: dict,
    db_session: AsyncSession, user: UserProfile,
) -> None:
    account, period = await _setup(db_session, user)
    await db_session.commit()
    response = await client.put(
        f"/api/v1/tax/periods/{period.id}/accounts/{account.id}/scope",
        json={"scope": "Nonsense", "note": None},
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_set_scope_period_not_found(
    client: AsyncClient, authenticated_headers: dict,
    db_session: AsyncSession, user: UserProfile,
) -> None:
    account, _ = await _setup(db_session, user)
    await db_session.commit()
    response = await client.put(
        f"/api/v1/tax/periods/99999/accounts/{account.id}/scope",
        json={"scope": "Out of Scope", "note": None},
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
