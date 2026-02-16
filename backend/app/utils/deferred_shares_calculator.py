"""
Deferred Shares Balance Calculation Utility

Provides unified access to deferred shares, cash, and RSU calculation functions.
All individual calculation functions are in separate modules.
"""

# Re-export types and functions for backward compatibility
from .deferred_cash import (
    DeferredCashCalculation,
    calculate_deferred_cash_balance,
    calculate_deferred_cash_balance_detailed,
    calculate_deferred_cash_balance_safe,
)
from .deferred_shares import (
    DeferredSharesCalculation,
    calculate_deferred_shares_balance,
    calculate_deferred_shares_balance_detailed,
    calculate_deferred_shares_balance_safe,
)
from .rsu import (
    RSUCalculation,
    calculate_rsu_balance,
    calculate_rsu_balance_detailed,
    calculate_rsu_balance_safe,
)

__all__ = [
    "DeferredSharesCalculation",
    "DeferredCashCalculation",
    "RSUCalculation",
    "calculate_deferred_shares_balance_detailed",
    "calculate_deferred_shares_balance",
    "calculate_deferred_shares_balance_safe",
    "calculate_deferred_cash_balance_detailed",
    "calculate_deferred_cash_balance",
    "calculate_deferred_cash_balance_safe",
    "calculate_rsu_balance_detailed",
    "calculate_rsu_balance",
    "calculate_rsu_balance_safe",
]
