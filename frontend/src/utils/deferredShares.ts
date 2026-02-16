/**
 * Deferred Shares Balance Calculation
 */

export interface DeferredSharesCalculation {
  balance: number; // In pounds
  grossAmount: number; // In pounds (before tax)
  capitalGainsTax: number; // In pounds (20% of gain)
  gain: number; // In pounds (unrealized gain/loss)
}

/**
 * Calculate detailed deferred shares valuation
 */
export function calculateDeferredSharesBalanceDetailed(
  numberOfShares: number,
  currentPrice: number,
  purchasePrice: number
): DeferredSharesCalculation {
  if (numberOfShares < 0 || currentPrice < 0 || purchasePrice < 0) {
    return {
      balance: 0,
      grossAmount: 0,
      capitalGainsTax: 0,
      gain: 0,
    };
  }

  const currentValueInPence = numberOfShares * currentPrice;
  const purchaseValueInPence = numberOfShares * purchasePrice;
  const gainInPence = currentValueInPence - purchaseValueInPence;
  const taxOnGainInPence = gainInPence * 0.2;
  const balanceInPence = currentValueInPence - taxOnGainInPence;

  return {
    balance: balanceInPence / 100,
    grossAmount: currentValueInPence / 100,
    capitalGainsTax: taxOnGainInPence / 100,
    gain: gainInPence / 100,
  };
}

/**
 * Calculate the balance for deferred shares
 */
export function calculateDeferredSharesBalance(
  numberOfShares: number,
  currentPrice: number,
  purchasePrice: number
): number {
  const calculation = calculateDeferredSharesBalanceDetailed(numberOfShares, currentPrice, purchasePrice);
  return calculation.balance;
}

/**
 * Parse string values and calculate deferred shares balance
 */
export function calculateDeferredSharesBalanceSafe(
  numberOfShares: string | null | undefined,
  currentPrice: string | null | undefined,
  purchasePrice: string | null | undefined
): number | null {
  if (!numberOfShares || !currentPrice || !purchasePrice) {
    return null;
  }

  const shares = parseInt(numberOfShares, 10);
  const current = parseInt(currentPrice, 10);
  const purchase = parseInt(purchasePrice, 10);

  if (Number.isNaN(shares) || Number.isNaN(current) || Number.isNaN(purchase)) {
    return null;
  }

  return calculateDeferredSharesBalance(shares, current, purchase);
}

/**
 * Parse string values and calculate detailed deferred shares valuation
 */
export function calculateDeferredSharesBalanceDetailedSafe(
  numberOfShares: string | null | undefined,
  currentPrice: string | null | undefined,
  purchasePrice: string | null | undefined
): DeferredSharesCalculation | null {
  if (!numberOfShares || !currentPrice || !purchasePrice) {
    return null;
  }

  const shares = parseInt(numberOfShares, 10);
  const current = parseInt(currentPrice, 10);
  const purchase = parseInt(purchasePrice, 10);

  if (Number.isNaN(shares) || Number.isNaN(current) || Number.isNaN(purchase)) {
    return null;
  }

  return calculateDeferredSharesBalanceDetailed(shares, current, purchase);
}
