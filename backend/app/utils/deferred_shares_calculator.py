"""
Deferred Shares Balance Calculation Utility

Implements the deferred shares valuation formula:
Balance = (Number of shares × current price) - (((number of shares × current price) - (number of shares × purchase price)) × 0.2)

The 0.2 factor represents 20% capital gains tax applied to unrealized gains.
All prices are assumed to be in pence, and the result is converted to pounds.

Also handles Deferred Cash balance calculations:
Balance = balance × 0.53 (47% discount/tax applied)

Also handles RSU balance calculations:
Balance = (shares × price) × 0.53 (47% tax applied)
"""

from typing import Optional, TypedDict
import logging

logger = logging.getLogger(__name__)


class DeferredSharesCalculation(TypedDict):
    """Result of deferred shares calculation with breakdown"""
    balance: float  # In pounds
    gross_amount: float  # In pounds (before tax)
    capital_gains_tax: float  # In pounds (20% of gain)
    gain: float  # In pounds (unrealized gain/loss)


class DeferredCashCalculation(TypedDict):
    """Result of deferred cash calculation with breakdown"""
    balance: float  # In pounds (after 47% discount)
    gross_amount: float  # In pounds (before discount)
    tax_discount: float  # In pounds (47% of balance)


class RSUCalculation(TypedDict):
    """Result of RSU calculation with breakdown"""
    balance: float  # In pounds (after 47% tax)
    gross_amount: float  # In pounds (before tax)
    tax_taken: float  # In pounds (47% of balance)


def calculate_deferred_shares_balance_detailed(
    number_of_shares: int,
    current_price: int,
    purchase_price: int,
) -> DeferredSharesCalculation:
    """
    Calculate detailed deferred shares valuation.
    
    Applies formula exactly as specified:
    (Number of shares × current price) - (((number of shares × current price) - (number of shares × purchase price)) × 0.2)
    
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
    # (Number of shares × current price) - (((number of shares × current price) - (number of shares × purchase price)) × 0.2)
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
    """
    Calculate the balance for deferred shares.
    
    Applies formula exactly as specified:
    (Number of shares × current price) - (((number of shares × current price) - (number of shares × purchase price)) × 0.2)
    
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
    """
    Parse string values and calculate deferred shares balance.
    
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
        logger.warning(
            f"Failed to parse deferred shares values: shares={number_of_shares}, "
            f"current={current_price}, purchase={purchase_price}. Error: {e}"
        )
        return None

    try:
        return calculate_deferred_shares_balance(shares, current, purchase)
    except ValueError as e:
        logger.warning(f"Invalid values for deferred shares calculation: {e}")
        return None

def calculate_deferred_cash_balance_detailed(
    balance_in_pence: int,
) -> DeferredCashCalculation:
    """
    Calculate detailed deferred cash valuation with 47% discount.
    
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
    """
    Calculate the balance for deferred cash with 47% discount.
    
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
    """
    Parse string value and calculate deferred cash balance.
    
    Args:
        balance_in_pence: Balance in pence (as string)
    
    Returns:
        Balance in pounds after 47% discount (as float), or None if parsing fails or value is missing
    """
    # Return None if value is missing
    if not balance_in_pence:
        return None

    try:
        balance = int(balance_in_pence)
    except (ValueError, TypeError) as e:
        logger.warning(
            f"Failed to parse deferred cash value: balance={balance_in_pence}. Error: {e}"
        )
        return None

    try:
        return calculate_deferred_cash_balance(balance)
    except ValueError as e:
        logger.warning(f"Invalid value for deferred cash calculation: {e}")
        return None

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

    # Calculate gross amount (shares × price)
    gross_in_pence = number_of_shares * current_price
    
    # Apply 47% tax
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
        Balance in pounds after 47% tax (as float), or None if parsing fails or values are missing
    """
    # Return None if any value is missing
    if not number_of_shares or not current_price:
        return None

    try:
        shares = int(number_of_shares)
        current = int(current_price)
    except (ValueError, TypeError) as e:
        logger.warning(
            f"Failed to parse RSU values: shares={number_of_shares}, "
            f"current={current_price}. Error: {e}"
        )
        return None

    try:
        return calculate_rsu_balance(shares, current)
    except ValueError as e:
        logger.warning(f"Invalid values for RSU calculation: {e}")
        return None
