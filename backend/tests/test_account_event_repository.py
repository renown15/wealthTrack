from datetime import datetime, timedelta

import pytest
from sqlalchemy import select

from app.models.account_event import AccountEvent
from app.models.reference_data import ReferenceData
from app.repositories.account_event_repository import AccountEventRepository


@pytest.mark.asyncio
async def test_list_events_returns_reference_labels(db_session, account):
    repository = AccountEventRepository(db_session)

    result = await db_session.execute(
        select(ReferenceData).where(
            ReferenceData.class_key == "event_type:balance_update"
        )
    )
    event_type_ref = result.scalar_one()

    now = datetime.utcnow()
    older = now - timedelta(hours=1)
    event_new = AccountEvent(
        account_id=account.id,
        user_id=account.user_id,
        type_id=event_type_ref.id,
        value="+500.00",
        created_at=now,
    )
    event_old = AccountEvent(
        account_id=account.id,
        user_id=account.user_id,
        type_id=event_type_ref.id,
        value="-150.00",
        created_at=older,
    )
    db_session.add_all([event_new, event_old])
    await db_session.flush()

    events = await repository.list_events(account.id, account.user_id)

    assert len(events) == 2
    assert events[0]["id"] == event_new.id
    assert events[1]["id"] == event_old.id
    assert events[0]["event_type"] == event_type_ref.reference_value
    assert events[1]["event_type"] == event_type_ref.reference_value
    assert events[0]["value"] == "+500.00"
    assert events[1]["value"] == "-150.00"


@pytest.mark.asyncio
async def test_list_events_returns_empty_for_account_with_no_events(db_session, account):
    repository = AccountEventRepository(db_session)

    events = await repository.list_events(account.id, account.user_id)

    assert events == []
