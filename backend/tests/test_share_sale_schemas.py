"""Tests for share sale Pydantic schemas."""
import pytest

from app.schemas.share_sale import ShareSaleRequest, ShareSaleResponse


class TestShareSaleRequest:
    def test_valid_request(self):
        req = ShareSaleRequest(
            shares_account_id=1,
            cash_account_id=2,
            tax_liability_account_id=3,
            shares_sold="100",
            sale_price_per_share="1500",
        )
        assert req.shares_account_id == 1
        assert req.cash_account_id == 2
        assert req.tax_liability_account_id == 3
        assert req.shares_sold == "100"
        assert req.sale_price_per_share == "1500"

    def test_missing_required_field_raises(self):
        with pytest.raises(Exception):
            ShareSaleRequest(
                shares_account_id=1,
                cash_account_id=2,
                tax_liability_account_id=3,
                shares_sold="100",
                # missing sale_price_per_share
            )


class TestShareSaleResponse:
    def test_valid_response(self):
        resp = ShareSaleResponse(
            shares_sold="100",
            sale_price_per_share="1500",
            proceeds="150000",
            purchase_price_per_share="1200",
            cgt="5000",
            remaining_shares="900",
            cash_new_balance="150000",
            tax_liability_new_balance="5000",
        )
        assert resp.shares_sold == "100"
        assert resp.proceeds == "150000"
        assert resp.cgt == "5000"
        assert resp.remaining_shares == "900"

    def test_remaining_shares_optional(self):
        resp = ShareSaleResponse(
            shares_sold="50",
            sale_price_per_share="1500",
            proceeds="75000",
            purchase_price_per_share="1200",
            cgt="2500",
            remaining_shares=None,
            cash_new_balance="75000",
            tax_liability_new_balance="2500",
        )
        assert resp.remaining_shares is None
