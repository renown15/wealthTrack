"""Tests for share_sale_service — calculate and execute share sale."""
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from app.services.share_sale_service import _get_cgt_rate, execute_share_sale
from tests.test_share_sale_service_helpers import (
    make_request,
    make_session_and_repos,
    patch_repos,
)

# ── _get_cgt_rate ─────────────────────────────────────────────────────────────


class TestGetCgtRate:
    @pytest.mark.asyncio
    async def test_returns_rate_from_db(self):
        session = AsyncMock()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = "24"
        session.execute = AsyncMock(return_value=result_mock)
        rate = await _get_cgt_rate(session)
        assert rate == Decimal("24")

    @pytest.mark.asyncio
    async def test_defaults_to_20_when_not_found(self):
        session = AsyncMock()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        session.execute = AsyncMock(return_value=result_mock)
        rate = await _get_cgt_rate(session)
        assert rate == Decimal("20")


# ── error paths ───────────────────────────────────────────────────────────────


class TestExecuteShareSaleErrors:
    @pytest.mark.asyncio
    async def test_raises_404_when_shares_account_not_found(self, monkeypatch):
        session, account_repo, attr_repo, event_repo, group_repo = make_session_and_repos()
        account_repo.get_by_id = AsyncMock(side_effect=lambda aid, uid: None)
        patch_repos(monkeypatch, account_repo, attr_repo, event_repo, group_repo)
        with pytest.raises(HTTPException) as exc:
            await execute_share_sale(make_request(), 1, session)
        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_raises_404_when_cash_account_not_found(self, monkeypatch):
        session, account_repo, attr_repo, event_repo, group_repo = make_session_and_repos()
        account_repo.get_by_id = AsyncMock(
            side_effect=lambda aid, uid: (MagicMock(id=aid) if aid == 1 else None)
        )
        patch_repos(monkeypatch, account_repo, attr_repo, event_repo, group_repo)
        with pytest.raises(HTTPException) as exc:
            await execute_share_sale(make_request(), 1, session)
        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_raises_404_when_tax_account_not_found(self, monkeypatch):
        session, account_repo, attr_repo, event_repo, group_repo = make_session_and_repos()
        account_repo.get_by_id = AsyncMock(
            side_effect=lambda aid, uid: (MagicMock(id=aid) if aid in (1, 2) else None)
        )
        patch_repos(monkeypatch, account_repo, attr_repo, event_repo, group_repo)
        with pytest.raises(HTTPException) as exc:
            await execute_share_sale(make_request(), 1, session)
        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_raises_422_when_no_purchase_price(self, monkeypatch):
        session, account_repo, attr_repo, event_repo, group_repo = make_session_and_repos()
        attr_repo.get_attribute_by_name = AsyncMock(return_value=None)
        patch_repos(monkeypatch, account_repo, attr_repo, event_repo, group_repo)
        with pytest.raises(HTTPException) as exc:
            await execute_share_sale(make_request(), 1, session)
        assert exc.value.status_code == 422

    @pytest.mark.asyncio
    async def test_raises_422_when_no_share_count(self, monkeypatch):
        session, account_repo, attr_repo, event_repo, group_repo = make_session_and_repos()
        attr_repo.get_attribute_by_name = AsyncMock(
            side_effect=lambda aid, uid, name: ("10000" if name == "purchase_price" else None)
        )
        patch_repos(monkeypatch, account_repo, attr_repo, event_repo, group_repo)
        with pytest.raises(HTTPException) as exc:
            await execute_share_sale(make_request(), 1, session)
        assert exc.value.status_code == 422

    @pytest.mark.asyncio
    async def test_raises_422_when_selling_zero_shares(self, monkeypatch):
        session, account_repo, attr_repo, event_repo, group_repo = make_session_and_repos()
        patch_repos(monkeypatch, account_repo, attr_repo, event_repo, group_repo)
        with pytest.raises(HTTPException) as exc:
            await execute_share_sale(make_request(shares_sold="0"), 1, session)
        assert exc.value.status_code == 422

    @pytest.mark.asyncio
    async def test_raises_422_when_selling_more_than_held(self, monkeypatch):
        session, account_repo, attr_repo, event_repo, group_repo = make_session_and_repos(
            number_of_shares="50"
        )
        patch_repos(monkeypatch, account_repo, attr_repo, event_repo, group_repo)
        with pytest.raises(HTTPException) as exc:
            await execute_share_sale(make_request(shares_sold="100"), 1, session)
        assert exc.value.status_code == 422

    @pytest.mark.asyncio
    async def test_raises_500_when_event_types_missing(self, monkeypatch):
        session, account_repo, attr_repo, event_repo, group_repo = make_session_and_repos()
        event_repo.get_event_type_id = AsyncMock(return_value=None)
        patch_repos(monkeypatch, account_repo, attr_repo, event_repo, group_repo)
        with pytest.raises(HTTPException) as exc:
            await execute_share_sale(make_request(), 1, session)
        assert exc.value.status_code == 500


# ── success path ──────────────────────────────────────────────────────────────


class TestExecuteShareSaleSuccess:
    @pytest.mark.asyncio
    async def test_returns_correct_response(self, monkeypatch):
        session, account_repo, attr_repo, event_repo, group_repo = make_session_and_repos(
            purchase_price="10000",
            number_of_shares="1000",
            cgt_rate="24",
        )
        patch_repos(monkeypatch, account_repo, attr_repo, event_repo, group_repo)
        resp = await execute_share_sale(
            make_request(shares_sold="100", sale_price_per_share="15000"), 1, session
        )

        assert resp.shares_sold == "100"
        assert resp.sale_price_per_share == "15000"
        assert resp.proceeds == "15000.00"  # 100 * 15000 / 100
        assert resp.capital_gain == "5000.00"  # 100 * (15000-10000) / 100
        assert resp.cgt == "1200.00"  # 5000 * 24/100
        assert resp.remaining_shares == "900"
        assert resp.cgt_rate == "24"

    @pytest.mark.asyncio
    async def test_creates_event_group(self, monkeypatch):
        session, account_repo, attr_repo, event_repo, group_repo = make_session_and_repos()
        patch_repos(monkeypatch, account_repo, attr_repo, event_repo, group_repo)
        await execute_share_sale(make_request(), 1, session)
        group_repo.create_group.assert_called_once_with(1, "Share Sale")

    @pytest.mark.asyncio
    async def test_six_events_written(self, monkeypatch):
        # 6 events: Share Sale, Balance Update (shares), Deposit,
        # Balance Update (cash), Capital Gains Tax, Balance Update (tax)
        session, account_repo, attr_repo, event_repo, group_repo = make_session_and_repos()
        patch_repos(monkeypatch, account_repo, attr_repo, event_repo, group_repo)
        await execute_share_sale(make_request(), 1, session)
        assert event_repo.create_event.call_count == 6

    @pytest.mark.asyncio
    async def test_new_cash_balance_added_to_existing(self, monkeypatch):
        session, account_repo, attr_repo, event_repo, group_repo = make_session_and_repos(
            purchase_price="10000",
            number_of_shares="1000",
            cgt_rate="0",
            latest_cash_balance="200.00",
        )
        patch_repos(monkeypatch, account_repo, attr_repo, event_repo, group_repo)
        resp = await execute_share_sale(
            make_request(shares_sold="100", sale_price_per_share="15000"), 1, session
        )
        # proceeds = 15000.00, existing cash = 200.00
        assert resp.cash_new_balance == "15200.00"
