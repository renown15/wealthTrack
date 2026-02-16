"""Tests for RSU wrapper utility functions."""

import pytest

from app.utils.rsu import (
    calculate_rsu_balance,
    calculate_rsu_balance_detailed,
    calculate_rsu_balance_safe,
)


class TestRsuWrapper:
    """Tests for RSU wrapper utility functions."""

    def test_calculate_rsu_balance_detailed_basic(self):
        """Test detailed RSU calculation."""
        # 100 shares @ 500p = £500 gross
        # Tax = £235, After tax = £265
        result = calculate_rsu_balance_detailed(100, 500)
        assert result["balance"] == 265.0
        assert result["gross_amount"] == 500.0
        assert result["tax_taken"] == 235.0

    def test_calculate_rsu_balance_detailed_zero_shares(self):
        """Test with zero shares."""
        result = calculate_rsu_balance_detailed(0, 500)
        assert result["balance"] == 0.0
        assert result["gross_amount"] == 0.0
        assert result["tax_taken"] == 0.0

    def test_calculate_rsu_balance_detailed_zero_price(self):
        """Test with zero price."""
        result = calculate_rsu_balance_detailed(100, 0)
        assert result["balance"] == 0.0
        assert result["gross_amount"] == 0.0
        assert result["tax_taken"] == 0.0

    def test_calculate_rsu_balance_detailed_negative_shares(self):
        """Test that negative shares raises error."""
        with pytest.raises(ValueError):
            calculate_rsu_balance_detailed(-100, 500)

    def test_calculate_rsu_balance_detailed_negative_price(self):
        """Test that negative price raises error."""
        with pytest.raises(ValueError):
            calculate_rsu_balance_detailed(100, -500)

    def test_calculate_rsu_balance_wrapper(self):
        """Test simple RSU balance calculation."""
        result = calculate_rsu_balance(100, 500)
        assert result == 265.0

    def test_calculate_rsu_balance_safe_valid(self):
        """Test safe function with valid strings."""
        result = calculate_rsu_balance_safe("100", "500")
        assert result == 265.0

    def test_calculate_rsu_balance_safe_zero_values(self):
        """Test safe function with zero values."""
        result = calculate_rsu_balance_safe("0", "500")
        assert result == 0.0

    def test_calculate_rsu_balance_safe_none_shares(self):
        """Test that None shares returns None."""
        assert calculate_rsu_balance_safe(None, "500") is None

    def test_calculate_rsu_balance_safe_none_price(self):
        """Test that None price returns None."""
        assert calculate_rsu_balance_safe("100", None) is None

    def test_calculate_rsu_balance_safe_empty_string(self):
        """Test that empty string returns None."""
        assert calculate_rsu_balance_safe("100", "") is None

    def test_calculate_rsu_balance_safe_invalid_string(self):
        """Test that invalid string returns None."""
        assert calculate_rsu_balance_safe("abc", "500") is None

    def test_calculate_rsu_balance_safe_negative_string(self):
        """Test that negative string returns None."""
        assert calculate_rsu_balance_safe("-100", "500") is None
