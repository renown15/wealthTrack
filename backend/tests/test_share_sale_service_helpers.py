"""Shared helpers for share sale service tests."""
from decimal import Decimal
from typing import Any
from unittest.mock import AsyncMock, MagicMock

from app.schemas.share_sale import ShareSaleRequest


def make_request(**kwargs: Any) -> ShareSaleRequest:
    """Build a ShareSaleRequest with sensible defaults."""
    defaults: dict[str, Any] = {
        "shares_account_id": 1,
        "cash_account_id": 2,
        "tax_liability_account_id": 3,
        "shares_sold": "100",
        "sale_price_per_share": "15000",
    }
    defaults.update(kwargs)
    return ShareSaleRequest(**defaults)


def make_account(account_id: int) -> MagicMock:
    """Return a mock Account with the given id."""
    acc = MagicMock()
    acc.id = account_id
    return acc


def make_session_and_repos(
    shares_account: Any = None,
    cash_account: Any = None,
    tax_account: Any = None,
    purchase_price: str = "10000",
    number_of_shares: str = "1000",
    cgt_rate: str = "24",
    latest_cash_balance: str = "0",
    latest_tax_balance: str = "0",
) -> tuple:
    """Create a mock session and all four repositories used by share_sale_service."""
    session = AsyncMock()

    account_repo = AsyncMock()
    account_repo.get_by_id = AsyncMock(side_effect=lambda aid, uid: {
        1: shares_account or make_account(1),
        2: cash_account or make_account(2),
        3: tax_account or make_account(3),
    }.get(aid))

    attr_repo = AsyncMock()
    attr_repo.get_attribute_by_name = AsyncMock(side_effect=lambda aid, uid, name: {
        "purchase_price": purchase_price,
        "number_of_shares": number_of_shares,
    }.get(name))
    attr_repo.set_attribute_by_name = AsyncMock(return_value=MagicMock(id=99))

    event_repo = AsyncMock()
    event_repo.get_event_type_id = AsyncMock(side_effect=lambda name: {
        "Share Sale": 10, "Balance Update": 11, "Deposit": 12, "Capital Gains Tax": 13,
    }.get(name))
    event_repo.create_event = AsyncMock(side_effect=lambda *a, **kw: MagicMock(id=50))
    event_repo.get_latest_balance_update = AsyncMock(side_effect=lambda aid, uid: {
        2: latest_cash_balance, 3: latest_tax_balance,
    }.get(aid, "0"))

    cgt_result = MagicMock()
    cgt_result.scalar_one_or_none.return_value = cgt_rate
    session.execute = AsyncMock(return_value=cgt_result)

    group_repo = AsyncMock()
    group_repo.create_group = AsyncMock(return_value=MagicMock(id=77))
    group_repo.add_event_member = AsyncMock()
    group_repo.add_attribute_member = AsyncMock()

    return session, account_repo, attr_repo, event_repo, group_repo


def patch_repos(monkeypatch: Any, account_repo: Any, attr_repo: Any, event_repo: Any, group_repo: Any) -> None:
    """Monkeypatch all repository constructors in the share_sale_service module."""
    import app.services.share_sale_service as svc_mod
    monkeypatch.setattr(svc_mod, "AccountRepository", lambda s: account_repo)
    monkeypatch.setattr(svc_mod, "AccountAttributeRepository", lambda s: attr_repo)
    monkeypatch.setattr(svc_mod, "AccountEventRepository", lambda s: event_repo)
    monkeypatch.setattr(svc_mod, "EventGroupRepository", lambda s: group_repo)
