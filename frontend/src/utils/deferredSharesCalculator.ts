/**
 * Deferred Accounts Balance Calculation Utility
 * 
 * Handles calculations for:
 * 1. Deferred Shares: (shares × currentPrice) - (((shares × currentPrice) - (shares × purchasePrice)) × 0.2)
 * 2. Deferred Cash: balance × 0.53 (47% discount applied)
 * 3. RSUs: (shares × currentPrice) × 0.53 (47% tax applied)
 */

export interface DeferredSharesCalculation {
  balance: number; // In pounds
  grossAmount: number; // In pounds (before tax)
  capitalGainsTax: number; // In pounds (20% of gain)
  gain: number; // In pounds (unrealized gain/loss)
}

export interface DeferredCashCalculation {
  balance: number; // In pounds (after 47% discount)
  grossAmount: number; // In pounds (before discount)
  taxDiscount: number; // In pounds (47% of balance)
}

export interface RSUCalculation {
  balance: number; // In pounds (after 47% tax)
  grossAmount: number; // In pounds (before tax)
  taxTaken: number; // In pounds (47% of balance)
}

/**
 * Calculate detailed deferred shares valuation
 * @param numberOfShares - Number of shares (as integer)
 * @param currentPrice - Current price in pence (as integer)
 * @param purchasePrice - Purchase price in pence (as integer)
 * @returns Calculation object with balance, gross amount, and tax details
 */
export function calculateDeferredSharesBalanceDetailed(
  numberOfShares: number,
  currentPrice: number,
  purchasePrice: number
): DeferredSharesCalculation {
  // Validate inputs
  if (numberOfShares < 0 || currentPrice < 0 || purchasePrice < 0) {
    console.warn('[DeferredSharesCalculator] Negative values provided', {
      numberOfShares,
      currentPrice,
      purchasePrice,
    });
    return {
      balance: 0,
      grossAmount: 0,
      capitalGainsTax: 0,
      gain: 0,
    };
  }

  // Apply formula exactly as specified:
  // (Number of shares × current price) - (((number of shares × current price) - (number of shares × purchase price)) × 0.2)
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
 * @param numberOfShares - Number of shares (as integer)
 * @param currentPrice - Current price in pence (as integer)
 * @param purchasePrice - Purchase price in pence (as integer)
 * @returns Balance in pounds (as number)
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
 * @param numberOfShares - Number of shares (as string)
 * @param currentPrice - Current price in pence (as string)
 * @param purchasePrice - Purchase price in pence (as string)
 * @returns Balance in pounds (as number), or null if parsing fails
 */
export function calculateDeferredSharesBalanceSafe(
  numberOfShares: string | null | undefined,
  currentPrice: string | null | undefined,
  purchasePrice: string | null | undefined
): number | null {
  // Return null if any value is missing
  if (!numberOfShares || !currentPrice || !purchasePrice) {
    return null;
  }

  const shares = parseInt(numberOfShares, 10);
  const current = parseInt(currentPrice, 10);
  const purchase = parseInt(purchasePrice, 10);

  // Return null if any value failed to parse
  if (Number.isNaN(shares) || Number.isNaN(current) || Number.isNaN(purchase)) {
    console.warn('[DeferredSharesCalculator] Failed to parse values', {
      numberOfShares,
      currentPrice,
      purchasePrice,
    });
    return null;
  }

  return calculateDeferredSharesBalance(shares, current, purchase);
}

/**
 * Parse string values and calculate detailed deferred shares valuation
 * @param numberOfShares - Number of shares (as string)
 * @param currentPrice - Current price in pence (as string)
 * @param purchasePrice - Purchase price in pence (as string)
 * @returns Calculation object, or null if parsing fails
 */
export function calculateDeferredSharesBalanceDetailedSafe(
  numberOfShares: string | null | undefined,
  currentPrice: string | null | undefined,
  purchasePrice: string | null | undefined
): DeferredSharesCalculation | null {
  // Return null if any value is missing
  if (!numberOfShares || !currentPrice || !purchasePrice) {
    return null;
  }

  const shares = parseInt(numberOfShares, 10);
  const current = parseInt(currentPrice, 10);
  const purchase = parseInt(purchasePrice, 10);

  // Return null if any value failed to parse
  if (Number.isNaN(shares) || Number.isNaN(current) || Number.isNaN(purchase)) {
    console.warn('[DeferredSharesCalculator] Failed to parse values', {
      numberOfShares,
      currentPrice,
      purchasePrice,
    });
    return null;
  }

  return calculateDeferredSharesBalanceDetailed(shares, current, purchase);
}

/**
 * Calculate detailed deferred cash valuation with 47% discount
 * @param balanceInPence - Balance in pence (as number)
 * @returns Calculation object with balance, gross amount, and discount details
 */
export function calculateDeferredCashBalanceDetailed(
  balanceInPence: number
): DeferredCashCalculation {
  // Validate input
  if (balanceInPence < 0) {
    console.warn('[DeferredCashCalculator] Negative balance provided', {
      balanceInPence,
    });
    return {
      balance: 0,
      grossAmount: 0,
      taxDiscount: 0,
    };
  }

  // Apply 47% discount: discounted_balance = balance × 0.53
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
 * @param balanceInPence - Balance in pence (as number)
 * @returns Balance in pounds after 47% discount
 */
export function calculateDeferredCashBalance(
  balanceInPence: number
): number {
  const calculation = calculateDeferredCashBalanceDetailed(balanceInPence);
  return calculation.balance;
}

/**
 * Parse string balance and calculate deferred cash valuation
 * @param balanceInPence - Balance in pence (as string)
 * @returns Calculation object, or null if parsing fails
 */
export function calculateDeferredCashBalanceDetailedSafe(
  balanceInPence: string | null | undefined
): DeferredCashCalculation | null {
  // Return null if value is missing
  if (!balanceInPence) {
    return null;
  }

  const balance = parseInt(balanceInPence, 10);

  // Return null if value failed to parse
  if (Number.isNaN(balance)) {
    console.warn('[DeferredCashCalculator] Failed to parse balance', {
      balanceInPence,
    });
    return null;
  }

  return calculateDeferredCashBalanceDetailed(balance);
}

/**
 * Parse string balance and calculate deferred cash balance
 * @param balanceInPence - Balance in pence (as string)
 * @returns Balance in pounds, or null if parsing fails
 */
export function calculateDeferredCashBalanceSafe(
  balanceInPence: string | null | undefined
): number | null {
  // Return null if value is missing
  if (!balanceInPence) {
    return null;
  }

  const balance = parseInt(balanceInPence, 10);

  // Return null if value failed to parse
  if (Number.isNaN(balance)) {
    console.warn('[DeferredCashCalculator] Failed to parse balance', {
      balanceInPence,
    });
    return null;
  }

  return calculateDeferredCashBalance(balance);
}

/**
 * Calculate detailed RSU valuation with 47% tax
 * @param numberOfShares - Number of shares (as integer)
 * @param currentPrice - Current price in pence (as integer)
 * @returns Calculation object with balance, gross amount, and tax details
 */
export function calculateRSUBalanceDetailed(
  numberOfShares: number,
  currentPrice: number
): RSUCalculation {
  // Calculate gross amount (shares × price)
  const grossInPence = numberOfShares * currentPrice;

  // Apply 47% tax
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
 * @param numberOfShares - Number of shares (as integer)
 * @param currentPrice - Current price in pence (as integer)
 * @returns Balance in pounds (after 47% tax)
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
 * @param numberOfShares - Number of shares (as string)
 * @param currentPrice - Current price in pence (as string)
 * @returns Calculation object with balance, gross amount, and tax details; or null if parsing fails
 */
export function calculateRSUBalanceDetailedSafe(
  numberOfShares: string | null | undefined,
  currentPrice: string | null | undefined
): RSUCalculation | null {
  // Return null if any value is missing
  if (!numberOfShares || !currentPrice) {
    return null;
  }

  const shares = parseInt(numberOfShares, 10);
  const price = parseInt(currentPrice, 10);

  // Return null if values failed to parse
  if (Number.isNaN(shares) || Number.isNaN(price)) {
    console.warn('[RSUCalculator] Failed to parse values', {
      numberOfShares,
      currentPrice,
    });
    return null;
  }

  return calculateRSUBalanceDetailed(shares, price);
}

/**
 * Parse string values and calculate RSU balance with error handling
 * @param numberOfShares - Number of shares (as string)
 * @param currentPrice - Current price in pence (as string)
 * @returns Balance in pounds (after 47% tax), or null if parsing fails
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
