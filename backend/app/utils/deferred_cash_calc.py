"""Deferred Cash Balance Calculation Utility.

Handles Deferred Cash balance calculations:
Balance = balance × 0.53 (47% discount/tax applied)
"""

import logging
from typing import Optional, TypedDict

logger = logging.getLogger(__name__)


class DeferredCashCalculation(TypedDict):
    """Result of deferred cash calculation with breakdown"""
    balance: float  # In pounds (after 47% discount)
    gross_amount: float  # In pounds (before discount)
    tax_discount: float  # In pounds (47% of balance)


def calculate_deferred_cash_balance_detailed(
    balance_in_pence: int,
) -> DeferredCashCalculation:
    """Calculate detailed deferred cash valuation with 47% discount.

    Applies formula: balance × 0.53 (47% discount/tax applied)

    Args:
        balance_in_pence: Balance in pence (as integer)

    Returns:
        DeferredCashCalculation dict with balance, gross amount, and tax details

    Raises:
        ValueError: If balance is negative
    """
    if balance_in_pence < 0:
        raise ValueError(f"Negative balance not allowed: {balance_in_pence}")

    # Apply 47% discount
    discount_in_pence = balance_in_pence * 0.47
    discounted_balance_in_pence = balance_in_pence * 0.53

    return DeferredCashCalculation(
        balance=discounted_balance_in_pence / 100,
        gross_amount=balance_in_pence / 100,
        tax_discount=discount_in_pence / 100,
    )


def calculate_deferred_cash_balance(
    balance_in_pence: int,
) -> float:
    """Calculate the balance for deferred cash with 47% discount.

    Applies formula: balance × 0.53

    Args:
        balance_in_pence: Balance in pence (as integer)

    Returns:
        Balance in pounds after discount (as float)

    Raises:
        ValueError: If balance is negative
    """
    calculation = calculate_deferred_cash_balance_detailed(balance_in_pence)
    return calculation["balance"]


def calculate_deferred_cash_balance_safe(
    balance_in_pence: Optional[str],
) -> Optional[float]:
    """Parse string value and calculate deferred cash balance.

    Args:
        balance_in_pence: Balance in pence (as string)

    Returns:
        Balance in pounds after 47% discount (as float), or None if parsing fails or
        value is missing
    """
    # Return None if value is missing
    if not balance_in_pence:
        return None

    try:
        balance = int(balance_in_pence)
    except (ValueError, TypeError) as e:
        msg = "Failed to parse deferred cash value: balance=%s - %s" % (balance_in_pence, e)  # pylint: disable=consider-using-f-string
        logger.warning(msg)
        return None

    try:
        return calculate_deferred_cash_balance(balance)
    except ValueError as e:
        msg = f"Invalid calculation: {e}"
        logger.warning(msg, exc_info=True)
        return None
