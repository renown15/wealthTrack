"""The tax return 'Comment' persists as the account's Notes attribute."""
from datetime import date, datetime

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.reference_data import ReferenceData
from app.models.tax_period import TaxPeriod
from app.models.user_profile import UserProfile
from app.repositories.account_attribute_repository import AccountAttributeRepository


async def _ref_id(db: AsyncSession, class_key: str, value: str) -> int:
    existing = (await db.execute(
        select(ReferenceData.id).where(
            ReferenceData.class_key == class_key,
            ReferenceData.reference_value == value,
        )
    )).scalar_one_or_none()
    if existing is not None:
        return existing
    ref = ReferenceData(class_key=class_key, reference_value=value, sort_index=99)
    db.add(ref)
    await db.flush()
    return ref.id


@pytest.mark.asyncio
async def test_tax_return_comment_persists_as_notes_attribute(
    client: AsyncClient,
    authenticated_headers: dict,
    db_session: AsyncSession,
    user: UserProfile,
) -> None:
    type_id = await _ref_id(db_session, "account_type", "Savings Account")
    status_id = await _ref_id(db_session, "account_status", "Active")
    await _ref_id(db_session, "account_attribute_type", "Notes")

    account = Account(user_id=user.id, name="Savings", type_id=type_id, status_id=status_id)
    db_session.add(account)
    period = TaxPeriod()
    period.user_id = user.id
    period.name = "2024/25"
    period.start_date = date(2024, 4, 6)
    period.end_date = date(2025, 4, 5)
    period.created_at = period.updated_at = datetime.utcnow()
    db_session.add(period)
    await db_session.flush()
    await db_session.commit()

    response = await client.put(
        f"/api/v1/tax/periods/{period.id}/accounts/{account.id}/return",
        json={"income": 100.0, "comment": "HSBC Employment"},
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK

    attrs = await AccountAttributeRepository(db_session).get_all_attributes_for_accounts(
        [account.id], user.id
    )
    assert attrs.get(account.id, {}).get("Notes") == "HSBC Employment"
