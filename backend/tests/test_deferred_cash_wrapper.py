"""Tests for deferred cash wrapper utility functions."""

import pytest

from app.utils.deferred_cash import (
    calculate_deferred_cash_balance,
    calculate_deferred_cash_balance_detailed,
    calculate_deferred_cash_balance_safe,
)


class TestDeferredCashWrapper:
    """Tests for deferred cash wrapper utility functions."""

    def test_calculate_deferred_cash_balance_detailed_wrapper(self):
        """Test the wrapper function for detailed calculation."""
        result = calculate_deferred_cash_balance_detailed(10000)
        assert result["balance"] == 53.0
        assert result["gross_amount"] == 100.0
        assert result["tax_discount"] == 47.0

    def test_calculate_deferred_cash_balance_detailed_zero(self):
        """Test with zero balance."""
        result = calculate_deferred_cash_balance_detailed(0)
        assert result["balance"] == 0.0
        assert result["gross_amount"] == 0.0
        assert result["tax_discount"] == 0.0

    def test_calculate_deferred_cash_balance_detailed_negative(self):
        """Test that negative balance raises error."""
        with pytest.raises(ValueError):
            calculate_deferred_cash_balance_detailed(-1000)

    def test_calculate_deferred_cash_balance_wrapper(self):
        """Test the wrapper for simple calculation."""
        result = calculate_deferred_cash_balance(10000)
        assert result == 53.0

    def test_calculate_deferred_cash_balance_safe_valid_string(self):
        """Test safe function with valid string."""
        result = calculate_deferred_cash_balance_safe("10000")
        assert result == 53.0

    def test_calculate_deferred_cash_balance_safe_integer_string(self):
        """Test safe function with integer string."""
        result = calculate_deferred_cash_balance_safe("5000")
        assert result == 26.5

    def test_calculate_deferred_cash_balance_safe_none(self):
        """Test that None returns None."""
        assert calculate_deferred_cash_balance_safe(None) is None

    def test_calculate_deferred_cash_balance_safe_empty_string(self):
        """Test that empty string returns None."""
        assert calculate_deferred_cash_balance_safe("") is None

    def test_calculate_deferred_cash_balance_safe_invalid_type(self):
        """Test that invalid type returns None."""
        assert calculate_deferred_cash_balance_safe("abc") is None

    def test_calculate_deferred_cash_balance_safe_negative_string(self):
        """Test that negative value returns None (caught by logger)."""
        assert calculate_deferred_cash_balance_safe("-1000") is None
