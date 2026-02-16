"""Tests for deferred shares wrapper utility functions."""

import pytest

from app.utils.deferred_shares import (
    calculate_deferred_shares_balance,
    calculate_deferred_shares_balance_detailed,
    calculate_deferred_shares_balance_safe,
)


class TestDeferredSharesWrapper:
    """Tests for deferred shares wrapper utility functions."""

    def test_calculate_deferred_shares_balance_detailed_gain(self):
        """Test detailed calculation with gain."""
        # 100 shares @ 500p, purchased @ 400p
        # Gain = £100, Tax = £20, Balance = £480
        result = calculate_deferred_shares_balance_detailed(100, 500, 400)
        assert result["balance"] == 480.0
        assert result["gross_amount"] == 500.0
        assert result["gain"] == 100.0
        assert result["capital_gains_tax"] == 20.0

    def test_calculate_deferred_shares_balance_detailed_zero(self):
        """Test detailed calculation with zero shares."""
        result = calculate_deferred_shares_balance_detailed(0, 500, 400)
        assert result["balance"] == 0.0
        assert result["gross_amount"] == 0.0
        assert result["gain"] == 0.0
        assert result["capital_gains_tax"] == 0.0

    def test_calculate_deferred_shares_balance_detailed_negative_shares(self):
        """Test that negative shares raises error."""
        with pytest.raises(ValueError):
            calculate_deferred_shares_balance_detailed(-100, 500, 400)

    def test_calculate_deferred_shares_balance_detailed_negative_price(self):
        """Test that negative price raises error."""
        with pytest.raises(ValueError):
            calculate_deferred_shares_balance_detailed(100, -500, 400)

    def test_calculate_deferred_shares_balance_detailed_negative_purchase(self):
        """Test that negative purchase price raises error."""
        with pytest.raises(ValueError):
            calculate_deferred_shares_balance_detailed(100, 500, -400)

    def test_calculate_deferred_shares_balance_wrapper(self):
        """Test simple balance calculation."""
        result = calculate_deferred_shares_balance(100, 500, 400)
        assert result == 480.0

    def test_calculate_deferred_shares_balance_safe_valid(self):
        """Test safe function with valid strings."""
        result = calculate_deferred_shares_balance_safe("100", "500", "400")
        assert result == 480.0

    def test_calculate_deferred_shares_balance_safe_none_shares(self):
        """Test that None shares returns None."""
        assert calculate_deferred_shares_balance_safe(None, "500", "400") is None

    def test_calculate_deferred_shares_balance_safe_none_price(self):
        """Test that None price returns None."""
        assert calculate_deferred_shares_balance_safe("100", None, "400") is None

    def test_calculate_deferred_shares_balance_safe_none_purchase(self):
        """Test that None purchase returns None."""
        assert calculate_deferred_shares_balance_safe("100", "500", None) is None

    def test_calculate_deferred_shares_balance_safe_invalid_shares(self):
        """Test that invalid shares returns None."""
        assert calculate_deferred_shares_balance_safe("abc", "500", "400") is None

    def test_calculate_deferred_shares_balance_safe_negative_string(self):
        """Test that negative string returns None."""
        assert calculate_deferred_shares_balance_safe("100", "500", "-400") is None
