"""RSU Balance Calculation."""

import logging
from typing import Optional, TypedDict

logger = logging.getLogger(__name__)


class RSUCalculation(TypedDict):
    """Result of RSU calculation with breakdown"""
    balance: float  # In pounds (after 47% tax)
    gross_amount: float  # In pounds (before tax)
    tax_taken: float  # In pounds (47% of balance)


def calculate_rsu_balance_detailed(
    number_of_shares: int,
    current_price: int,
) -> RSUCalculation:
    """
    Calculate detailed RSU valuation with 47% tax.

    Applies formula: (shares × price) × 0.53

    Args:
        number_of_shares: Number of shares (as integer)
        current_price: Current price in pence (as integer)

    Returns:
        RSUCalculation dict with balance, gross amount, and tax details

    Raises:
        ValueError: If any value is negative
    """
    if number_of_shares < 0 or current_price < 0:
        raise ValueError(
            f"Negative values not allowed: shares={number_of_shares}, "
            f"current_price={current_price}"
        )

    gross_in_pence = number_of_shares * current_price
    tax_in_pence = gross_in_pence * 0.47
    net_in_pence = gross_in_pence * 0.53

    return RSUCalculation(
        balance=net_in_pence / 100,
        gross_amount=gross_in_pence / 100,
        tax_taken=tax_in_pence / 100,
    )


def calculate_rsu_balance(
    number_of_shares: int,
    current_price: int,
) -> float:
    """
    Calculate the balance for RSU with 47% tax.

    Applies formula: (shares × price) × 0.53

    Args:
        number_of_shares: Number of shares (as integer)
        current_price: Current price in pence (as integer)

    Returns:
        Balance in pounds after tax (as float)

    Raises:
        ValueError: If any value is negative
    """
    calculation = calculate_rsu_balance_detailed(number_of_shares, current_price)
    return calculation["balance"]


def calculate_rsu_balance_safe(
    number_of_shares: Optional[str],
    current_price: Optional[str],
) -> Optional[float]:
    """
    Parse string values and calculate RSU balance.

    Args:
        number_of_shares: Number of shares (as string)
        current_price: Current price in pence (as string)

    Returns:
        Balance in pounds after 47% tax (as float), or None if parsing fails
    """
    if not number_of_shares or not current_price:
        return None

    try:
        shares = int(number_of_shares)
        current = int(current_price)
    except (ValueError, TypeError) as e:
        msg = "Parse failed: %s, %s - %s" % (number_of_shares, current_price, e)  # pylint: disable=consider-using-f-string
        logger.warning(msg)
        return None

    try:
        return calculate_rsu_balance(shares, current)
    except ValueError as e:
        msg = f"Invalid calculation: {e}"
        logger.warning(msg, exc_info=True)
        return None
