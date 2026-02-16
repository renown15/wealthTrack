"""Tests for deferred shares balance calculations."""

import pytest

from app.utils.deferred_shares_calc import (
    calculate_deferred_shares_balance,
    calculate_deferred_shares_balance_detailed,
    calculate_deferred_shares_balance_safe,
)


class TestDeferredSharesCalc:
    """Tests for deferred shares balance calculations."""

    def test_calculate_deferred_shares_balance_detailed_gain(self):
        """Test shares calculation with gain."""
        # 100 shares @ 500p current, 400p purchase
        # Gross = 100 * 500 = 50000p = £500
        # Purchase = 100 * 400 = 40000p = £400
        # Gain = 10000p = £100
        # Tax = 10000 * 0.2 = 2000p = £20
        # Balance = 50000 - 2000 = 48000p = £480
        result = calculate_deferred_shares_balance_detailed(100, 500, 400)
        assert result["balance"] == 480.0
        assert result["gross_amount"] == 500.0
        assert result["gain"] == 100.0
        assert result["capital_gains_tax"] == 20.0

    def test_calculate_deferred_shares_balance_detailed_loss(self):
        """Test shares calculation with loss."""
        # 100 shares @ 300p current, 400p purchase
        # Gross = 100 * 300 = 30000p = £300
        # Purchase = 100 * 400 = 40000p = £400
        # Gain = -10000p = -£100
        # Tax = -10000 * 0.2 = -2000p = -£20
        # Balance = 30000 - (-2000) = 32000p = £320
        result = calculate_deferred_shares_balance_detailed(100, 300, 400)
        assert result["balance"] == 320.0
        assert result["gross_amount"] == 300.0
        assert result["gain"] == -100.0
        assert result["capital_gains_tax"] == -20.0

    def test_calculate_deferred_shares_balance_detailed_zero_shares(self):
        """Test shares calculation with zero shares."""
        result = calculate_deferred_shares_balance_detailed(0, 500, 400)
        assert result["balance"] == 0.0
        assert result["gross_amount"] == 0.0
        assert result["gain"] == 0.0
        assert result["capital_gains_tax"] == 0.0

    def test_calculate_deferred_shares_balance_detailed_zero_price(self):
        """Test shares calculation with zero current price."""
        # 100 shares @ 0p current, 400p purchase
        # Gross = 100 * 0 = 0p = £0
        # Purchase = 100 * 400 = 40000p = £400
        # Gain = 0 - 40000 = -40000p = -£400
        # Tax = -40000 * 0.2 = -8000p = -£80
        # Balance = 0 - (-8000) = 8000p = £80
        result = calculate_deferred_shares_balance_detailed(100, 0, 400)
        assert result["balance"] == 80.0
        assert result["gross_amount"] == 0.0
        assert result["gain"] == -400.0
        assert result["capital_gains_tax"] == -80.0

    def test_calculate_deferred_shares_balance_detailed_negative_shares_raises(self):
        """Test that negative shares raises ValueError."""
        with pytest.raises(ValueError, match="Negative values not allowed"):
            calculate_deferred_shares_balance_detailed(-100, 500, 400)

    def test_calculate_deferred_shares_balance_detailed_negative_price_raises(self):
        """Test that negative current price raises ValueError."""
        with pytest.raises(ValueError, match="Negative values not allowed"):
            calculate_deferred_shares_balance_detailed(100, -500, 400)

    def test_calculate_deferred_shares_balance_detailed_negative_purchase_raises(self):
        """Test that negative purchase price raises ValueError."""
        with pytest.raises(ValueError, match="Negative values not allowed"):
            calculate_deferred_shares_balance_detailed(100, 500, -400)

    def test_calculate_deferred_shares_balance_basic(self):
        """Test basic shares balance calculation."""
        result = calculate_deferred_shares_balance(100, 500, 400)
        assert result == 480.0

    def test_calculate_deferred_shares_balance_safe_valid(self):
        """Test safe calculation with valid string inputs."""
        result = calculate_deferred_shares_balance_safe("100", "500", "400")
        assert result == 480.0

    def test_calculate_deferred_shares_balance_safe_none_shares(self):
        """Test safe calculation returns None for None shares."""
        assert calculate_deferred_shares_balance_safe(None, "500", "400") is None

    def test_calculate_deferred_shares_balance_safe_none_price(self):
        """Test safe calculation returns None for None price."""
        assert calculate_deferred_shares_balance_safe("100", None, "400") is None

    def test_calculate_deferred_shares_balance_safe_empty_string(self):
        """Test safe calculation returns None for empty string."""
        assert calculate_deferred_shares_balance_safe("100", "", "400") is None

    def test_calculate_deferred_shares_balance_safe_invalid_string(self):
        """Test safe calculation returns None for non-numeric string."""
        assert calculate_deferred_shares_balance_safe("100", "abc", "400") is None

    def test_calculate_deferred_shares_balance_safe_negative_string(self):
        """Test safe calculation returns None for negative string value."""
        assert calculate_deferred_shares_balance_safe("100", "500", "-400") is None
