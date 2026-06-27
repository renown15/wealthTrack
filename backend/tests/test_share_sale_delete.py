"""Tests for share_sale_delete_service.delete_share_sale."""
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.models.account_event import AccountEvent
from app.models.account_event_attribute_group import AccountEventAttributeGroup
from app.models.reference_data import ReferenceData
from app.services.share_sale_delete_service import delete_share_sale


def _make_attr_repo(current: str = "400"):
    repo = AsyncMock()
    repo.get_attribute_by_name = AsyncMock(return_value=current)
    repo.set_attribute_by_name = AsyncMock()
    return repo


class TestDeleteShareSale:
    @pytest.mark.asyncio
    async def test_raises_when_group_not_found(self):
        session = AsyncMock()
        session.get = AsyncMock(return_value=None)
        with pytest.raises(ValueError, match="Share sale not found"):
            await delete_share_sale(99, 1, session)

    @pytest.mark.asyncio
    async def test_raises_when_group_belongs_to_other_user(self):
        session = AsyncMock()
        session.get = AsyncMock(return_value=MagicMock(id=77, user_id=9))
        with pytest.raises(ValueError, match="Share sale not found"):
            await delete_share_sale(77, 1, session)

    @pytest.mark.asyncio
    async def test_raises_when_no_share_sale_event(self, monkeypatch):
        import app.services.share_sale_delete_service as svc
        monkeypatch.setattr(svc, "AccountAttributeRepository", lambda s: _make_attr_repo())

        group = MagicMock(id=77, user_id=1)
        bal_ev = MagicMock(id=51, account_id=2, value="10", type_id=5)
        member = MagicMock(account_event_id=51)
        members_result = MagicMock()
        members_result.scalars = lambda: MagicMock(all=lambda: [member])

        session = AsyncMock()
        session.execute = AsyncMock(return_value=members_result)

        async def mock_get(cls, pk):
            if cls is AccountEventAttributeGroup:
                return group
            if cls is AccountEvent:
                return bal_ev
            if cls is ReferenceData:
                return MagicMock(reference_value="Balance Update")
            return None

        session.get = mock_get
        with pytest.raises(ValueError, match="Corrupt share sale group"):
            await delete_share_sale(77, 1, session)

    @pytest.mark.asyncio
    async def test_restores_shares_and_deletes_group(self, monkeypatch):
        import app.services.share_sale_delete_service as svc
        attr_repo = _make_attr_repo(current="400")
        monkeypatch.setattr(svc, "AccountAttributeRepository", lambda s: attr_repo)

        group = MagicMock(id=77, user_id=1)
        sale_ev = MagicMock(id=50, account_id=1, value="100", type_id=30)
        bal_ev = MagicMock(id=51, account_id=2, value="500", type_id=5)
        events = {50: sale_ev, 51: bal_ev}
        refs = {30: MagicMock(reference_value="Share Sale"),
                5: MagicMock(reference_value="Balance Update")}
        # one event member for the sale, one for a balance update, one attribute member
        members = [
            MagicMock(account_event_id=50),
            MagicMock(account_event_id=51),
            MagicMock(account_event_id=None),
        ]
        members_result = MagicMock()
        members_result.scalars = lambda: MagicMock(all=lambda: members)

        session = AsyncMock()
        session.execute = AsyncMock(return_value=members_result)
        session.delete = AsyncMock()

        async def mock_get(cls, pk):
            if cls is AccountEventAttributeGroup:
                return group
            if cls is AccountEvent:
                return events.get(pk)
            if cls is ReferenceData:
                return refs.get(pk)
            return None

        session.get = mock_get
        await delete_share_sale(77, 1, session)

        # 400 held + 100 sold restored back to 500
        attr_repo.set_attribute_by_name.assert_awaited_once_with(
            1, 1, "number_of_shares", "500.0000"
        )
        # 3 members + 2 events + 1 group
        assert session.delete.call_count == 6
