/**
 * RSU Balance Calculation
 */

export interface RSUCalculation {
  balance: number; // In pounds (after 47% tax)
  grossAmount: number; // In pounds (before tax)
  taxTaken: number; // In pounds (47% of balance)
}

/**
 * Calculate detailed RSU valuation with 47% tax
 */
export function calculateRSUBalanceDetailed(
  numberOfShares: number,
  currentPrice: number
): RSUCalculation {
  const grossInPence = numberOfShares * currentPrice;
  const taxInPence = grossInPence * 0.47;
  const netInPence = grossInPence * 0.53;

  return {
    balance: netInPence / 100,
    grossAmount: grossInPence / 100,
    taxTaken: taxInPence / 100,
  };
}

/**
 * Calculate RSU balance with 47% tax
 */
export function calculateRSUBalance(
  numberOfShares: number,
  currentPrice: number
): number {
  const calculation = calculateRSUBalanceDetailed(numberOfShares, currentPrice);
  return calculation.balance;
}

/**
 * Parse string values and calculate RSU balance with error handling
 */
export function calculateRSUBalanceDetailedSafe(
  numberOfShares: string | null | undefined,
  currentPrice: string | null | undefined
): RSUCalculation | null {
  if (!numberOfShares || !currentPrice) {
    return null;
  }

  const shares = parseInt(numberOfShares, 10);
  const price = parseInt(currentPrice, 10);

  if (Number.isNaN(shares) || Number.isNaN(price)) {
    return null;
  }

  return calculateRSUBalanceDetailed(shares, price);
}

/**
 * Parse string values and calculate RSU balance with error handling
 */
export function calculateRSUBalanceSafe(
  numberOfShares: string | null | undefined,
  currentPrice: string | null | undefined
): number | null {
  const calculation = calculateRSUBalanceDetailedSafe(
    numberOfShares,
    currentPrice
  );
  if (calculation) {
    return calculation.balance;
  }
  return null;
}
