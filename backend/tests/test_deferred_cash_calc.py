"""Tests for deferred cash balance calculations."""

import pytest

from app.utils.deferred_cash_calc import (
    calculate_deferred_cash_balance,
    calculate_deferred_cash_balance_detailed,
    calculate_deferred_cash_balance_safe,
)


class TestDeferredCashCalc:
    """Tests for deferred cash balance calculations."""

    def test_calculate_deferred_cash_balance_detailed_basic(self):
        """Test detailed cash calculation with basic values."""
        result = calculate_deferred_cash_balance_detailed(10000)  # 100 pounds
        assert result["balance"] == 53.0  # 100 * 0.53
        assert result["gross_amount"] == 100.0
        assert result["tax_discount"] == 47.0  # 100 * 0.47

    def test_calculate_deferred_cash_balance_detailed_zero(self):
        """Test detailed cash calculation with zero balance."""
        result = calculate_deferred_cash_balance_detailed(0)
        assert result["balance"] == 0.0
        assert result["gross_amount"] == 0.0
        assert result["tax_discount"] == 0.0

    def test_calculate_deferred_cash_balance_detailed_large(self):
        """Test detailed cash calculation with large balance."""
        result = calculate_deferred_cash_balance_detailed(1000000)  # 10000 pounds
        assert result["balance"] == 5300.0
        assert result["gross_amount"] == 10000.0
        assert result["tax_discount"] == 4700.0

    def test_calculate_deferred_cash_balance_detailed_negative_raises(self):
        """Test that negative balance raises ValueError."""
        with pytest.raises(ValueError, match="Negative balance not allowed"):
            calculate_deferred_cash_balance_detailed(-1000)

    def test_calculate_deferred_cash_balance_basic(self):
        """Test simple cash balance calculation."""
        result = calculate_deferred_cash_balance(10000)
        assert result == 53.0

    def test_calculate_deferred_cash_balance_negative_raises(self):
        """Test that negative balance raises ValueError."""
        with pytest.raises(ValueError):
            calculate_deferred_cash_balance(-1000)

    def test_calculate_deferred_cash_balance_safe_valid(self):
        """Test safe calculation with valid string input."""
        result = calculate_deferred_cash_balance_safe("10000")
        assert result == 53.0

    def test_calculate_deferred_cash_balance_safe_none(self):
        """Test safe calculation returns None for None input."""
        assert calculate_deferred_cash_balance_safe(None) is None

    def test_calculate_deferred_cash_balance_safe_empty_string(self):
        """Test safe calculation returns None for empty string."""
        assert calculate_deferred_cash_balance_safe("") is None

    def test_calculate_deferred_cash_balance_safe_invalid_string(self):
        """Test safe calculation returns None for non-numeric string."""
        assert calculate_deferred_cash_balance_safe("not_a_number") is None

    def test_calculate_deferred_cash_balance_safe_negative_string(self):
        """Test safe calculation returns None for negative string value."""
        assert calculate_deferred_cash_balance_safe("-1000") is None
