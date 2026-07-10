"""Account deletion must cascade every table holding an FK to it.

Regression test for the Pi 500: deleting an account with a TaxReturn raised
ForeignKeyViolationError. Same latent failure existed for tax documents,
account documents, and event-group members (dividends/gifts/actual costs).
"""
from datetime import date

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.account_document import AccountDocument
from app.models.account_event import AccountEvent
from app.models.account_event_attribute_group import AccountEventAttributeGroup
from app.models.account_event_attribute_group_member import AccountEventAttributeGroupMember
from app.models.reference_data import ReferenceData
from app.models.tax_document import TaxDocument
from app.models.tax_period import TaxPeriod
from app.models.tax_return import TaxReturn
from app.models.user_profile import UserProfile


async def _count(db_session: AsyncSession, model, **filters) -> int:
    stmt = select(func.count()).select_from(model).filter_by(**filters)
    return (await db_session.execute(stmt)).scalar_one()


@pytest.mark.asyncio
async def test_delete_account_cascades_tax_docs_and_event_groups(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    db_session: AsyncSession,
    user: UserProfile,
    account: Account,
):
    """Deleting an account removes tax returns, documents, and event groups."""
    # Tax return + tax document chained off it
    period = TaxPeriod(user_id=user.id, name="2026/27",
                       start_date=date(2026, 4, 6), end_date=date(2027, 4, 5))
    db_session.add(period)
    await db_session.flush()
    tax_return = TaxReturn(user_id=user.id, account_id=account.id, tax_period_id=period.id)
    db_session.add(tax_return)
    await db_session.flush()
    db_session.add(TaxDocument(user_id=user.id, tax_return_id=tax_return.id,
                               filename="cert.pdf", file_data=b"pdf"))

    # Account document
    db_session.add(AccountDocument(user_id=user.id, account_id=account.id,
                                   filename="statement.pdf", file_data=b"pdf"))

    # Event group with a member referencing one of the account's events
    event_type = (await db_session.execute(
        select(ReferenceData).where(
            ReferenceData.class_key == "account_event_type",
            ReferenceData.reference_value == "Balance Update",
        )
    )).scalar_one()
    event = AccountEvent(user_id=user.id, account_id=account.id,
                         type_id=event_type.id, value="100.00")
    group = AccountEventAttributeGroup(user_id=user.id, type_id=event_type.id)
    db_session.add_all([event, group])
    await db_session.flush()
    db_session.add(AccountEventAttributeGroupMember(
        group_id=group.id, account_event_id=event.id, account_attribute_id=None,
    ))
    await db_session.commit()

    response = await client.delete(
        f"/api/v1/accounts/{account.id}", headers=authenticated_headers
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

    assert await _count(db_session, TaxReturn, account_id=account.id) == 0
    assert await _count(db_session, TaxDocument, tax_return_id=tax_return.id) == 0
    assert await _count(db_session, AccountDocument, account_id=account.id) == 0
    assert await _count(db_session, AccountEventAttributeGroupMember, group_id=group.id) == 0
    assert await _count(db_session, AccountEventAttributeGroup, id=group.id) == 0
    assert await _count(db_session, Account, id=account.id) == 0
