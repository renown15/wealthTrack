"""Tests for gift_service — calculate_iht_taper_rate, record_gift, get_user_gifts."""
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.gift_service import get_user_gifts, record_gift
from app.services.gift_summary_builder import calculate_iht_taper_rate

# ── helpers ───────────────────────────────────────────────────────────────────


def _years_ago(years: float) -> date:
    return date.today() - timedelta(days=int(years * 365.25))


def _make_account_repo(found: bool = True):
    repo = AsyncMock()
    repo.get_by_id = AsyncMock(
        return_value=MagicMock(id=1, name="My Account") if found else None
    )
    return repo


def _make_attr_repo():
    repo = AsyncMock()
    repo.get_attribute_by_name = AsyncMock(return_value=None)
    repo.set_attribute_by_name = AsyncMock()
    return repo


def _make_event_repo(missing_type: bool = False):
    repo = AsyncMock()
    type_map = {
        "Gift": 20, "Gift Date": 21, "Gift Donor": 22,
        "Balance Update": 5, "Gift Shares": 23,
    }
    repo.get_event_type_id = AsyncMock(
        side_effect=lambda name: None if missing_type else type_map.get(name)
    )
    repo.create_event = AsyncMock(side_effect=lambda *a, **kw: MagicMock(id=50))
    repo.get_latest_balance_update = AsyncMock(return_value="1000.00")
    return repo


def _make_group_repo():
    repo = AsyncMock()
    repo.create_group = AsyncMock(return_value=MagicMock(id=77))
    repo.add_event_member = AsyncMock()
    return repo


def _patch_repos(monkeypatch, account_repo, attr_repo, event_repo, group_repo):
    import app.services.gift_service as svc
    monkeypatch.setattr(svc, "AccountRepository", lambda s: account_repo)
    monkeypatch.setattr(svc, "AccountAttributeRepository", lambda s: attr_repo)
    monkeypatch.setattr(svc, "AccountEventRepository", lambda s: event_repo)
    monkeypatch.setattr(svc, "EventGroupRepository", lambda s: group_repo)


# ── calculate_iht_taper_rate ─────────────────────────────────────────────────


class TestCalculateIhtTaperRate:
    def test_under_3_years_returns_40_percent(self):
        assert calculate_iht_taper_rate(_years_ago(2)) == Decimal("0.40")

    def test_just_over_3_years_returns_32_percent(self):
        assert calculate_iht_taper_rate(_years_ago(3.1)) == Decimal("0.32")

    def test_between_3_and_4_years_returns_32_percent(self):
        assert calculate_iht_taper_rate(_years_ago(3.5)) == Decimal("0.32")

    def test_between_4_and_5_years_returns_24_percent(self):
        assert calculate_iht_taper_rate(_years_ago(4.5)) == Decimal("0.24")

    def test_between_5_and_6_years_returns_16_percent(self):
        assert calculate_iht_taper_rate(_years_ago(5.5)) == Decimal("0.16")

    def test_between_6_and_7_years_returns_8_percent(self):
        assert calculate_iht_taper_rate(_years_ago(6.5)) == Decimal("0.08")

    def test_7_or_more_years_returns_zero(self):
        assert calculate_iht_taper_rate(_years_ago(8)) == Decimal("0")


# ── record_gift ───────────────────────────────────────────────────────────────


class TestRecordGift:
    @pytest.mark.asyncio
    async def test_raises_when_account_not_found(self, monkeypatch):
        _patch_repos(
            monkeypatch, _make_account_repo(found=False),
            _make_attr_repo(), _make_event_repo(), _make_group_repo(),
        )
        with pytest.raises(ValueError, match="Account not found"):
            await record_gift(1, 1, "Granny", date(2024, 1, 1), "5000.00", AsyncMock())

    @pytest.mark.asyncio
    async def test_raises_when_event_types_missing(self, monkeypatch):
        _patch_repos(
            monkeypatch, _make_account_repo(),
            _make_attr_repo(), _make_event_repo(missing_type=True), _make_group_repo(),
        )
        with pytest.raises(ValueError, match="Required event types not found"):
            await record_gift(1, 1, "Granny", date(2024, 1, 1), "5000.00", AsyncMock())

    @pytest.mark.asyncio
    async def test_cash_gift_creates_correct_events(self, monkeypatch):
        event_repo = _make_event_repo()
        group_repo = _make_group_repo()
        _patch_repos(monkeypatch, _make_account_repo(), _make_attr_repo(), event_repo, group_repo)

        result = await record_gift(1, 1, "Granny", date(2024, 1, 1), "5000.00", AsyncMock())

        assert result.group_id == 77
        assert result.donor == "Granny"
        assert result.gift_value_gbp == "5000.00"
        assert result.num_shares is None
        # Gift, Gift Date, Gift Donor, Balance Update = 4 events
        assert event_repo.create_event.call_count == 4
        assert group_repo.add_event_member.call_count == 4

    @pytest.mark.asyncio
    async def test_balance_update_is_sum_of_existing_plus_gift(self, monkeypatch):
        event_repo = _make_event_repo()
        event_repo.get_latest_balance_update = AsyncMock(return_value="2500.00")
        group_repo = _make_group_repo()
        _patch_repos(monkeypatch, _make_account_repo(), _make_attr_repo(), event_repo, group_repo)

        await record_gift(1, 1, "Uncle", date(2024, 6, 1), "1500.00", AsyncMock())

        # 4th create_event call is Balance Update: 2500 + 1500 = 4000
        balance_call = event_repo.create_event.call_args_list[3]
        assert balance_call.args[3] == "4000.00"

    @pytest.mark.asyncio
    async def test_shares_gift_creates_shares_event_and_increments_count(self, monkeypatch):
        event_repo = _make_event_repo()
        attr_repo = _make_attr_repo()
        attr_repo.get_attribute_by_name = AsyncMock(return_value="100.0000")
        group_repo = _make_group_repo()
        _patch_repos(monkeypatch, _make_account_repo(), attr_repo, event_repo, group_repo)

        result = await record_gift(
            1, 1, "Parent", date(2023, 3, 1), "8000.00", AsyncMock(), num_shares="50"
        )

        assert result.num_shares == "50"
        # Gift, Gift Date, Gift Donor, Balance Update, Gift Shares = 5 events
        assert event_repo.create_event.call_count == 5
        attr_repo.set_attribute_by_name.assert_called_once_with(
            1, 1, "number_of_shares", "150.0000"
        )


# ── get_user_gifts ─────────────────────────────────────────────────────────────


class TestGetUserGifts:
    @pytest.mark.asyncio
    async def test_returns_empty_when_no_gift_group_type(self):
        session = AsyncMock()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none = MagicMock(return_value=None)
        session.execute = AsyncMock(return_value=result_mock)
        result = await get_user_gifts(1, session)
        assert result == []

    @pytest.mark.asyncio
    async def test_returns_empty_when_no_groups(self):
        session = AsyncMock()
        scalars_mock = MagicMock()
        scalars_mock.scalar_one_or_none = MagicMock(return_value=5)
        empty_scalars = MagicMock()
        empty_scalars.scalars = lambda: MagicMock(all=lambda: [])
        session.execute = AsyncMock(side_effect=[scalars_mock, empty_scalars])
        result = await get_user_gifts(1, session)
        assert result == []

