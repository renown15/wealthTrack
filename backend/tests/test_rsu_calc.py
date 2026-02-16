"""Tests for RSU balance calculations."""

import pytest

from app.utils.rsu_calc import (
    calculate_rsu_balance,
    calculate_rsu_balance_detailed,
    calculate_rsu_balance_safe,
)


class TestRsuCalc:
    """Tests for RSU balance calculations."""

    def test_calculate_rsu_balance_detailed_basic(self):
        """Test detailed RSU calculation with basic values."""
        # 100 shares @ 500p = 50000p = £500
        # Tax = 50000 * 0.47 = 23500p = £235
        # After tax = 50000 - 23500 = 26500p = £265
        result = calculate_rsu_balance_detailed(100, 500)
        assert result["balance"] == 265.0
        assert result["gross_amount"] == 500.0
        assert result["tax_taken"] == 235.0

    def test_calculate_rsu_balance_detailed_zero_shares(self):
        """Test RSU calculation with zero shares."""
        result = calculate_rsu_balance_detailed(0, 500)
        assert result["balance"] == 0.0
        assert result["gross_amount"] == 0.0
        assert result["tax_taken"] == 0.0

    def test_calculate_rsu_balance_detailed_zero_price(self):
        """Test RSU calculation with zero price."""
        result = calculate_rsu_balance_detailed(100, 0)
        assert result["balance"] == 0.0
        assert result["gross_amount"] == 0.0
        assert result["tax_taken"] == 0.0

    def test_calculate_rsu_balance_detailed_negative_shares_raises(self):
        """Test that negative shares raises ValueError."""
        with pytest.raises(ValueError, match="Negative values not allowed"):
            calculate_rsu_balance_detailed(-100, 500)

    def test_calculate_rsu_balance_detailed_negative_price_raises(self):
        """Test that negative price raises ValueError."""
        with pytest.raises(ValueError, match="Negative values not allowed"):
            calculate_rsu_balance_detailed(100, -500)

    def test_calculate_rsu_balance_basic(self):
        """Test basic RSU balance calculation."""
        result = calculate_rsu_balance(100, 500)
        assert result == 265.0

    def test_calculate_rsu_balance_negative_raises(self):
        """Test that negative values raise ValueError."""
        with pytest.raises(ValueError):
            calculate_rsu_balance(-100, 500)

    def test_calculate_rsu_balance_safe_valid(self):
        """Test safe calculation with valid string inputs."""
        result = calculate_rsu_balance_safe("100", "500")
        assert result == 265.0

    def test_calculate_rsu_balance_safe_none_shares(self):
        """Test safe calculation returns None for None shares."""
        assert calculate_rsu_balance_safe(None, "500") is None

    def test_calculate_rsu_balance_safe_none_price(self):
        """Test safe calculation returns None for None price."""
        assert calculate_rsu_balance_safe("100", None) is None

    def test_calculate_rsu_balance_safe_empty_string(self):
        """Test safe calculation returns None for empty string."""
        assert calculate_rsu_balance_safe("100", "") is None

    def test_calculate_rsu_balance_safe_invalid_string(self):
        """Test safe calculation returns None for non-numeric string."""
        assert calculate_rsu_balance_safe("100", "abc") is None

    def test_calculate_rsu_balance_safe_negative_string(self):
        """Test safe calculation returns None for negative string value."""
        assert calculate_rsu_balance_safe("-100", "500") is None
