"""Tests for Deferred Shares Balance Calculator Utility"""

import pytest

from app.utils.deferred_shares_calculator import (
    calculate_deferred_shares_balance,
    calculate_deferred_shares_balance_safe,
)


class TestCalculateDeferredSharesBalance:
    """Tests for calculate_deferred_shares_balance function"""

    def test_basic_calculation(self):
        """Test basic deferred shares balance calculation"""
        # 1000 shares @ 5000p current, 4000p purchase
        # = (1000 × 5000) - (((1000 × 5000) - (1000 × 4000)) × 0.2) / 100
        # = 4800000 / 100
        # = £48000.00
        result = calculate_deferred_shares_balance(1000, 5000, 4000)
        assert result == 48000.0

    def test_calculation_when_price_equals_purchase_price(self):
        """Test calculation when current price equals purchase price"""
        # 1000 shares @ 5000p current, 5000p purchase
        # = (1000 × 5000) - (0 × 0.2) / 100
        # = 5000000 / 100
        # = £50000.00
        result = calculate_deferred_shares_balance(1000, 5000, 5000)
        assert result == 50000.0

    def test_calculation_when_price_below_purchase(self):
        """Test calculation when current price is below purchase price"""
        # 1000 shares @ 3000p current, 5000p purchase
        # = (1000 × 3000) - (((1000 × 3000) - (1000 × 5000)) × 0.2) / 100
        # = ((3000000 - (-2000000)) × 0.2) = 3000000 - (-400000) = 3400000 / 100
        # = £34000.00
        result = calculate_deferred_shares_balance(1000, 3000, 5000)
        assert result == 34000.0

    def test_zero_shares(self):
        """Test calculation with zero shares"""
        result = calculate_deferred_shares_balance(0, 5000, 4000)
        assert result == 0.0

    def test_zero_prices(self):
        """Test calculation with zero prices"""
        result = calculate_deferred_shares_balance(1000, 0, 0)
        assert result == 0.0

    def test_large_numbers(self):
        """Test calculation with large numbers"""
        # 1000000 shares @ 10000p current, 8000p purchase
        # = (1000000 × 10000) - (((1000000 × 10000) - (1000000 × 8000)) × 0.2) / 100
        # = 9600000000 / 100
        # = £96000000.00
        result = calculate_deferred_shares_balance(1000000, 10000, 8000)
        assert result == 96000000.0

    def test_negative_shares_raises_error(self):
        """Test that negative shares raises ValueError"""
        with pytest.raises(ValueError):
            calculate_deferred_shares_balance(-100, 5000, 4000)

    def test_negative_current_price_raises_error(self):
        """Test that negative current price raises ValueError"""
        with pytest.raises(ValueError):
            calculate_deferred_shares_balance(1000, -5000, 4000)

    def test_negative_purchase_price_raises_error(self):
        """Test that negative purchase price raises ValueError"""
        with pytest.raises(ValueError):
            calculate_deferred_shares_balance(1000, 5000, -4000)

    def test_decimal_precision(self):
        """Test calculation maintains decimal precision"""
        # Test with values that produce decimal results
        result = calculate_deferred_shares_balance(100, 5555, 4444)
        # = (100 × 5555) - (((100 × 5555) - (100 × 4444)) × 0.2) / 100
        # = 533280 / 100
        # = £5332.80
        assert abs(result - 5332.8) < 0.0001


class TestCalculateDeferredSharesBalanceSafe:
    """Tests for calculate_deferred_shares_balance_safe function"""

    def test_safe_calculation_with_string_input(self):
        """Test safe calculation with valid string inputs"""
        result = calculate_deferred_shares_balance_safe("1000", "5000", "4000")
        assert result == 48000.0

    def test_safe_calculation_returns_none_for_missing_shares(self):
        """Test function returns None when shares is missing"""
        result = calculate_deferred_shares_balance_safe(None, "5000", "4000")
        assert result is None

    def test_safe_calculation_returns_none_for_missing_current_price(self):
        """Test function returns None when current price is missing"""
        result = calculate_deferred_shares_balance_safe("1000", None, "4000")
        assert result is None

    def test_safe_calculation_returns_none_for_missing_purchase_price(self):
        """Test function returns None when purchase price is missing"""
        result = calculate_deferred_shares_balance_safe("1000", "5000", None)
        assert result is None

    def test_safe_calculation_returns_none_for_empty_strings(self):
        """Test function returns None for empty strings"""
        result = calculate_deferred_shares_balance_safe("", "5000", "4000")
        assert result is None

    def test_safe_calculation_returns_none_for_invalid_numbers(self):
        """Test function returns None for non-numeric strings"""
        result = calculate_deferred_shares_balance_safe("abc", "5000", "4000")
        assert result is None

    def test_safe_calculation_returns_none_for_decimal_strings(self):
        """Test function returns None for decimal strings"""
        result = calculate_deferred_shares_balance_safe("1000.5", "5000", "4000")
        assert result is None

    def test_safe_calculation_with_undefined(self):
        """Test function handles undefined values gracefully"""
        result = calculate_deferred_shares_balance_safe(None, "5000", "4000")
        assert result is None

    def test_safe_calculation_valid_inputs(self):
        """Test safe calculation with valid inputs"""
        result = calculate_deferred_shares_balance_safe("2000", "7000", "5000")
        # = (2000 × 7000) - (((2000 × 7000) - (2000 × 5000)) × 0.2) / 100
        # = 13200000 / 100
        # = £132000.00
        assert result == 132000.0


class TestFormulaVerification:
    """Tests to verify the formula is correctly implemented"""

    def test_formula_equivalence_basic(self):
        """Verify formula: balance = (shares × currentPrice) - (((shares × currentPrice) - (shares × purchasePrice)) × 0.2)"""
        shares = 1000
        current_price = 5000
        purchase_price = 4000

        # Direct formula calculation
        direct_result = (
            (shares * current_price)
            - (((shares * current_price) - (shares * purchase_price)) * 0.2)
        ) / 100

        # Our implementation
        calculated_result = calculate_deferred_shares_balance(
            shares, current_price, purchase_price
        )

        assert abs(direct_result - calculated_result) < 0.0001

    def test_formula_equivalence_different_values(self):
        """Verify formula with different values"""
        shares = 2500
        current_price = 8500
        purchase_price = 6500

        # Direct formula
        direct_result = (
            (shares * current_price)
            - (((shares * current_price) - (shares * purchase_price)) * 0.2)
        ) / 100

        # Our implementation
        calculated_result = calculate_deferred_shares_balance(
            shares, current_price, purchase_price
        )

        assert abs(direct_result - calculated_result) < 0.0001

    def test_formula_simplification_correctness(self):
        """Verify simplified formula: shares × (0.8 × currentPrice + 0.2 × purchasePrice) / 100"""
        shares = 1500
        current_price = 6250
        purchase_price = 5000

        # Simplified formula we use
        simplified_result = shares * (0.8 * current_price + 0.2 * purchase_price) / 100

        # Our implementation
        calculated_result = calculate_deferred_shares_balance(
            shares, current_price, purchase_price
        )

        assert abs(simplified_result - calculated_result) < 0.0001
