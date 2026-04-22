"""Unit tests for TaxReturnRepository."""
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.repositories.tax_return_repository import TaxReturnRepository


def _make_repo():
    session = AsyncMock()
    return TaxReturnRepository(session), session


class TestTaxReturnRepositoryGetById:
    @pytest.mark.asyncio
    async def test_returns_record_when_found(self):
        repo, session = _make_repo()
        mock_return = MagicMock()
        result = MagicMock()
        result.scalar_one_or_none.return_value = mock_return
        session.execute = AsyncMock(return_value=result)

        found = await repo.get_by_id(return_id=1, user_id=42)
        assert found is mock_return

    @pytest.mark.asyncio
    async def test_returns_none_when_not_found(self):
        repo, session = _make_repo()
        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        session.execute = AsyncMock(return_value=result)

        found = await repo.get_by_id(return_id=999, user_id=42)
        assert found is None


class TestTaxReturnRepositoryListForPeriod:
    @pytest.mark.asyncio
    async def test_returns_list(self):
        repo, session = _make_repo()
        item1, item2 = MagicMock(), MagicMock()
        scalars = MagicMock()
        scalars.all.return_value = [item1, item2]
        result = MagicMock()
        result.scalars.return_value = scalars
        session.execute = AsyncMock(return_value=result)

        items = await repo.list_for_period(user_id=1, tax_period_id=5)
        assert items == [item1, item2]

    @pytest.mark.asyncio
    async def test_returns_empty_list(self):
        repo, session = _make_repo()
        scalars = MagicMock()
        scalars.all.return_value = []
        result = MagicMock()
        result.scalars.return_value = scalars
        session.execute = AsyncMock(return_value=result)

        items = await repo.list_for_period(user_id=1, tax_period_id=999)
        assert items == []


class TestTaxReturnRepositoryUpsert:
    @pytest.mark.asyncio
    async def test_creates_new_when_not_existing(self):
        repo, session = _make_repo()
        # get_for_account_period returns None → create path
        not_found = MagicMock()
        not_found.scalar_one_or_none.return_value = None
        created = MagicMock()
        created.id = 1
        session.execute = AsyncMock(return_value=not_found)
        session.flush = AsyncMock()
        session.refresh = AsyncMock()

        await repo.upsert(
            user_id=1,
            account_id=2,
            tax_period_id=3,
            income=100.0,
            capital_gain=None,
            tax_taken_off=10.0,
        )
        session.add.assert_called_once()
        session.flush.assert_called_once()

    @pytest.mark.asyncio
    async def test_updates_existing(self):
        repo, session = _make_repo()
        existing = MagicMock()
        existing.income = 50.0
        found = MagicMock()
        found.scalar_one_or_none.return_value = existing
        session.execute = AsyncMock(return_value=found)
        session.flush = AsyncMock()
        session.refresh = AsyncMock()

        await repo.upsert(
            user_id=1,
            account_id=2,
            tax_period_id=3,
            income=200.0,
            capital_gain=500.0,
            tax_taken_off=50.0,
        )
        assert existing.income == 200.0
        assert existing.capital_gain == 500.0
        session.flush.assert_called_once()
