"""Tests for account attribute save/update handler."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.controllers.account_attributes_handler import (
    load_account_attributes,
    save_account_attributes,
    update_account_attributes,
)
from app.schemas.account import AccountCreate, AccountUpdate


def _make_attr_repo(**overrides):
    repo = AsyncMock()
    repo.get_attribute_by_name = AsyncMock(return_value=None)
    repo.set_attribute_by_name = AsyncMock(return_value=MagicMock())
    repo.delete_attribute_by_name = AsyncMock(return_value=True)
    for k, v in overrides.items():
        setattr(repo, k, v)
    return repo


def _make_event_repo(events=None, type_id=5):
    repo = AsyncMock()
    repo.list_events = AsyncMock(return_value=events or [])
    repo.get_event_type_id = AsyncMock(return_value=type_id)
    return repo


def _make_response():
    resp = MagicMock()
    return resp


class TestLoadAccountAttributes:
    @pytest.mark.asyncio
    async def test_loads_all_fields(self):
        attr_repo = _make_attr_repo()
        attr_repo.get_attribute_by_name = AsyncMock(return_value="val")
        response = _make_response()
        await load_account_attributes(attr_repo, 1, 1, response)
        assert attr_repo.get_attribute_by_name.call_count == 15  # 15 ATTRIBUTE_FIELDS


class TestSaveAccountAttributes:
    @pytest.mark.asyncio
    async def test_saves_basic_fields(self):
        attr_repo = _make_attr_repo()
        data = AccountCreate(institution_id=1, name="Test", interest_rate="4.5")
        await save_account_attributes(attr_repo, 1, 1, data)
        attr_repo.set_attribute_by_name.assert_called()

    @pytest.mark.asyncio
    async def test_skips_empty_fields(self):
        attr_repo = _make_attr_repo()
        data = AccountCreate(institution_id=1, name="Test")
        await save_account_attributes(attr_repo, 1, 1, data)
        attr_repo.set_attribute_by_name.assert_not_called()

    @pytest.mark.asyncio
    async def test_validates_sort_code_on_save(self):
        attr_repo = _make_attr_repo()
        data = AccountCreate(institution_id=1, name="Test", sort_code="bad")
        with pytest.raises(ValueError, match="XX-YY-ZZ"):
            await save_account_attributes(attr_repo, 1, 1, data)

    @pytest.mark.asyncio
    async def test_encumbrance_with_session_creates_event(self):
        session = AsyncMock()
        attr_repo = _make_attr_repo()
        events = [{"value": "10000"}]
        with patch("app.controllers.account_attributes_handler.AccountEventRepository", return_value=_make_event_repo(events)), \
             patch("app.controllers.account_attributes_handler.AccountEventService") as mock_svc:
            mock_svc.return_value.log_event = AsyncMock()
            data = AccountCreate(institution_id=1, name="Test", encumbrance="2000")
            await save_account_attributes(attr_repo, 1, 1, data, session)
        attr_repo.set_attribute_by_name.assert_called()

    @pytest.mark.asyncio
    async def test_encumbrance_without_session_skipped(self):
        attr_repo = _make_attr_repo()
        data = AccountCreate(institution_id=1, name="Test", encumbrance="2000")
        await save_account_attributes(attr_repo, 1, 1, data, session=None)
        # encumbrance attr not saved without session
        calls = [c[0][2] for c in attr_repo.set_attribute_by_name.call_args_list]
        assert "encumbrance" not in calls


class TestUpdateAccountAttributes:
    @pytest.mark.asyncio
    async def test_remove_encumbrance_triggers_restore(self):
        session = AsyncMock()
        attr_repo = _make_attr_repo(get_attribute_by_name=AsyncMock(return_value="2000"))
        with patch("app.controllers.account_attributes_handler.AccountEventRepository", return_value=_make_event_repo()), \
             patch("app.controllers.account_attributes_handler.AccountEventService") as mock_svc:
            mock_svc.return_value.log_event = AsyncMock()
            attr_repo.get_attribute_by_name = AsyncMock(side_effect=["2000", "10000"])
            data = AccountUpdate(encumbrance=None)
            await update_account_attributes(attr_repo, 1, 1, data, session)
        attr_repo.delete_attribute_by_name.assert_called()

    @pytest.mark.asyncio
    async def test_set_encumbrance_when_none_existed(self):
        session = AsyncMock()
        attr_repo = _make_attr_repo()
        attr_repo.get_attribute_by_name = AsyncMock(return_value=None)
        with patch("app.controllers.account_attributes_handler.AccountEventRepository", return_value=_make_event_repo([{"value": "10000"}])), \
             patch("app.controllers.account_attributes_handler.AccountEventService") as mock_svc:
            mock_svc.return_value.log_event = AsyncMock()
            data = AccountUpdate(encumbrance="3000")
            await update_account_attributes(attr_repo, 1, 1, data, session)
        attr_repo.set_attribute_by_name.assert_called()

    @pytest.mark.asyncio
    async def test_change_encumbrance_with_gross_supplied(self):
        session = AsyncMock()
        attr_repo = _make_attr_repo()
        attr_repo.get_attribute_by_name = AsyncMock(return_value="1000")
        with patch("app.controllers.account_attributes_handler.AccountEventRepository", return_value=_make_event_repo()), \
             patch("app.controllers.account_attributes_handler.AccountEventService") as mock_svc:
            mock_svc.return_value.log_event = AsyncMock()
            data = AccountUpdate(encumbrance="2000", new_gross_balance="12000")
            await update_account_attributes(attr_repo, 1, 1, data, session)
        attr_repo.set_attribute_by_name.assert_called()

    @pytest.mark.asyncio
    async def test_clears_attribute_when_value_empty(self):
        attr_repo = _make_attr_repo()
        attr_repo.get_attribute_by_name = AsyncMock(return_value=None)
        data = AccountUpdate(interest_rate="")
        await update_account_attributes(attr_repo, 1, 1, data)
        attr_repo.delete_attribute_by_name.assert_called()

    @pytest.mark.asyncio
    async def test_validates_percentage_on_update(self):
        attr_repo = _make_attr_repo()
        attr_repo.get_attribute_by_name = AsyncMock(return_value=None)
        data = AccountUpdate(interest_rate="200")
        with pytest.raises(ValueError, match="between 0 and 100"):
            await update_account_attributes(attr_repo, 1, 1, data)


class TestSharesBalanceServiceInit:
    def test_initialization_stores_repo_and_session(self):
        from app.services.shares_balance_service import SharesBalanceService
        from unittest.mock import AsyncMock
        mock_session = AsyncMock()
        mock_repo = AsyncMock()
        mock_repo.session = mock_session
        svc = SharesBalanceService(mock_repo)
        assert svc.repo is mock_repo
        assert svc.session is mock_session
