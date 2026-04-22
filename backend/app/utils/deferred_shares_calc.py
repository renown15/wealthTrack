"""Deferred Shares Balance Calculation Utility.

Implements the deferred shares valuation formula:
Balance = (Number of shares × current price) - (((number of shares × current price)
- (number of shares × purchase price)) × 0.2)

The 0.2 factor represents 20% capital gains tax applied to unrealized gains.
All prices are assumed to be in pence, and the result is converted to pounds.
"""

import logging
from typing import Optional, TypedDict

logger = logging.getLogger(__name__)


class DeferredSharesCalculation(TypedDict):
    """Result of deferred shares calculation with breakdown"""

    balance: float  # In pounds
    gross_amount: float  # In pounds (before tax)
    capital_gains_tax: float  # In pounds (20% of gain)
    gain: float  # In pounds (unrealized gain/loss)


def calculate_deferred_shares_balance_detailed(
    number_of_shares: int,
    current_price: int,
    purchase_price: int,
) -> DeferredSharesCalculation:
    """Calculate detailed deferred shares valuation.

    Applies formula exactly as specified:
    (Number of shares × current price) - (((number of shares × current price)
    - (number of shares × purchase price)) × 0.2)

    Args:
        number_of_shares: Number of shares (as integer)
        current_price: Current price in pence (as integer)
        purchase_price: Purchase price in pence (as integer)

    Returns:
        DeferredSharesCalculation dict with balance, gross amount, and tax details

    Raises:
        ValueError: If any value is negative
    """
    if number_of_shares < 0 or current_price < 0 or purchase_price < 0:
        raise ValueError(
            f"Negative values not allowed: shares={number_of_shares}, "
            f"current_price={current_price}, purchase_price={purchase_price}"
        )

    # Apply formula exactly as specified:
    # (Number of shares × current price) - (((number of shares × current price)
    # - (number of shares × purchase price)) × 0.2)
    current_value_in_pence = number_of_shares * current_price
    purchase_value_in_pence = number_of_shares * purchase_price
    gain_in_pence = current_value_in_pence - purchase_value_in_pence
    tax_on_gain_in_pence = gain_in_pence * 0.2
    balance_in_pence = current_value_in_pence - tax_on_gain_in_pence

    return DeferredSharesCalculation(
        balance=balance_in_pence / 100,
        gross_amount=current_value_in_pence / 100,
        capital_gains_tax=tax_on_gain_in_pence / 100,
        gain=gain_in_pence / 100,
    )


def calculate_deferred_shares_balance(
    number_of_shares: int,
    current_price: int,
    purchase_price: int,
) -> float:
    """Calculate the balance for deferred shares.

    Applies formula exactly as specified:
    (Number of shares × current price) - (((number of shares × current price)
    - (number of shares × purchase price)) × 0.2)

    Args:
        number_of_shares: Number of shares (as integer)
        current_price: Current price in pence (as integer)
        purchase_price: Purchase price in pence (as integer)

    Returns:
        Balance in pounds (as float)

    Raises:
        ValueError: If any value is negative
    """
    calculation = calculate_deferred_shares_balance_detailed(
        number_of_shares, current_price, purchase_price
    )
    return calculation["balance"]


def calculate_deferred_shares_balance_safe(
    number_of_shares: Optional[str],
    current_price: Optional[str],
    purchase_price: Optional[str],
) -> Optional[float]:
    """Parse string values and calculate deferred shares balance.

    Args:
        number_of_shares: Number of shares (as string)
        current_price: Current price in pence (as string)
        purchase_price: Purchase price in pence (as string)

    Returns:
        Balance in pounds (as float), or None if parsing fails or values are missing
    """
    # Return None if any value is missing
    if not number_of_shares or not current_price or not purchase_price:
        return None

    try:
        shares = int(number_of_shares)
        current = int(current_price)
        purchase = int(purchase_price)
    except (ValueError, TypeError) as e:
        msg = "Parse: %s, %s, %s - %s" % (number_of_shares, current_price, purchase_price, e)  # pylint: disable=consider-using-f-string
        logger.warning(msg)
        return None

    try:
        return calculate_deferred_shares_balance(shares, current, purchase)
    except ValueError as e:
        msg = f"Invalid calculation: {e}"
        logger.warning(msg, exc_info=True)
        return None
