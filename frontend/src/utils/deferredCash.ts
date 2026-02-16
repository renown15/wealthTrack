/**
 * Deferred Cash Balance Calculation
 */

export interface DeferredCashCalculation {
  balance: number; // In pounds (after 47% discount)
  grossAmount: number; // In pounds (before discount)
  taxDiscount: number; // In pounds (47% of balance)
}

/**
 * Calculate detailed deferred cash valuation with 47% discount
 */
export function calculateDeferredCashBalanceDetailed(
  balanceInPence: number
): DeferredCashCalculation {
  if (balanceInPence < 0) {
    return {
      balance: 0,
      grossAmount: 0,
      taxDiscount: 0,
    };
  }

  const discountAmount = balanceInPence * 0.47;
  const discountedAmount = balanceInPence * 0.53;

  return {
    balance: discountedAmount / 100,
    grossAmount: balanceInPence / 100,
    taxDiscount: discountAmount / 100,
  };
}

/**
 * Calculate the balance for deferred cash with 47% discount
 */
export function calculateDeferredCashBalance(
  balanceInPence: number
): number {
  const calculation = calculateDeferredCashBalanceDetailed(balanceInPence);
  return calculation.balance;
}

/**
 * Parse string balance and calculate deferred cash valuation
 */
export function calculateDeferredCashBalanceDetailedSafe(
  balanceInPence: string | null | undefined
): DeferredCashCalculation | null {
  if (!balanceInPence) {
    return null;
  }

  const balance = parseInt(balanceInPence, 10);

  if (Number.isNaN(balance)) {
    return null;
  }

  return calculateDeferredCashBalanceDetailed(balance);
}

/**
 * Parse string balance and calculate deferred cash balance
 */
export function calculateDeferredCashBalanceSafe(
  balanceInPence: string | null | undefined
): number | null {
  if (!balanceInPence) {
    return null;
  }

  const balance = parseInt(balanceInPence, 10);

  if (Number.isNaN(balance)) {
    return null;
  }

  return calculateDeferredCashBalance(balance);
}
