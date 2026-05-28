"""Tests for gift deletion — delete_gift and delete_gift_by_event_id."""
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.models.account_event import AccountEvent
from app.models.account_event_attribute_group import AccountEventAttributeGroup
from app.models.reference_data import ReferenceData
from app.services.gift_service import delete_gift, delete_gift_by_event_id


def _make_event_repo():
    repo = AsyncMock()
    type_map = {"Gift": 20, "Balance Update": 5}
    repo.get_event_type_id = AsyncMock(side_effect=lambda name: type_map.get(name))
    repo.create_event = AsyncMock(side_effect=lambda *a, **kw: MagicMock(id=50))
    repo.get_latest_balance_update = AsyncMock(return_value="1000.00")
    return repo


def _make_attr_repo():
    repo = AsyncMock()
    repo.get_attribute_by_name = AsyncMock(return_value=None)
    repo.set_attribute_by_name = AsyncMock()
    return repo


# ── delete_gift ───────────────────────────────────────────────────────────────


class TestDeleteGift:
    @pytest.mark.asyncio
    async def test_raises_when_group_not_found(self):
        session = AsyncMock()
        session.get = AsyncMock(return_value=None)
        with pytest.raises(ValueError, match="Gift not found"):
            await delete_gift(99, 1, session)

    @pytest.mark.asyncio
    async def test_raises_when_group_belongs_to_other_user(self):
        session = AsyncMock()
        session.get = AsyncMock(return_value=MagicMock(id=77, user_id=9))
        with pytest.raises(ValueError, match="Gift not found"):
            await delete_gift(77, 1, session)

    @pytest.mark.asyncio
    async def test_reverses_balance_and_deletes_group(self, monkeypatch):
        import app.services.gift_service as svc
        event_repo = _make_event_repo()
        event_repo.get_latest_balance_update = AsyncMock(return_value="6000.00")
        monkeypatch.setattr(svc, "AccountEventRepository", lambda s: event_repo)
        monkeypatch.setattr(svc, "AccountAttributeRepository", lambda s: _make_attr_repo())

        group = MagicMock(id=77, user_id=1)
        gift_ev = MagicMock(id=50, account_id=1, value="5000.00", type_id=20)
        member = MagicMock(account_event_id=50)
        rd = MagicMock(reference_value="Gift")

        members_result = MagicMock()
        members_result.scalars = lambda: MagicMock(all=lambda: [member])

        session = AsyncMock()
        session.execute = AsyncMock(return_value=members_result)
        session.delete = AsyncMock()

        async def mock_get(cls, pk):
            if cls is AccountEventAttributeGroup:
                return group
            if cls is AccountEvent:
                return gift_ev
            if cls is ReferenceData:
                return rd
            return None

        session.get = mock_get

        await delete_gift(77, 1, session)

        balance_call = event_repo.create_event.call_args
        assert balance_call.args[3] == "1000.00"  # 6000 - 5000
        assert session.delete.call_count == 3  # member + event + group


# ── delete_gift_by_event_id ───────────────────────────────────────────────────


class TestDeleteGiftByEventId:
    @pytest.mark.asyncio
    async def test_raises_when_no_group_member_found(self):
        session = AsyncMock()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none = MagicMock(return_value=None)
        session.execute = AsyncMock(return_value=result_mock)
        with pytest.raises(ValueError, match="Gift not found"):
            await delete_gift_by_event_id(99, 1, session)

    @pytest.mark.asyncio
    async def test_delegates_to_delete_gift(self, monkeypatch):
        import app.services.gift_service as svc
        deleted_with = {}

        async def fake_delete(group_id, user_id, sess):
            deleted_with["group_id"] = group_id
            deleted_with["user_id"] = user_id

        monkeypatch.setattr(svc, "delete_gift", fake_delete)

        session = AsyncMock()
        member = MagicMock(group_id=77)
        result_mock = MagicMock()
        result_mock.scalar_one_or_none = MagicMock(return_value=member)
        session.execute = AsyncMock(return_value=result_mock)

        await delete_gift_by_event_id(50, 1, session)
        assert deleted_with == {"group_id": 77, "user_id": 1}
