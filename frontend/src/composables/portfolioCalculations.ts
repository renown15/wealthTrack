/**
 * Portfolio calculation utilities - computed categories
 */

import type { PortfolioItem } from '@/models/WealthTrackDataModels';

const CASH_TYPES = [
  'Current Account',
  'Savings Account',
  'Premium Bonds',
  'Fixed / Bonus Rate Saver',
];

const ISA_TYPES = [
  'Cash ISA',
  'Fixed Rate ISA',
  'Stocks ISA',
];

const ILLIQUID_TYPES = [
  'Deferred Shares',
  'Deferred Cash',
  'RSU',
];

const TRUST_TYPES = [
  'Trust Bank Account',
  'Trust Stocks Investment Account',
];

/**
 * Calculate total portfolio value from items
 */
export function calculateTotalValue(items: PortfolioItem[]): number {
  return items.reduce((sum, item) => {
    if (item.latestBalance?.value) {
      return sum + parseFloat(item.latestBalance.value);
    }
    return sum;
  }, 0);
}

/**
 * Calculate cash at hand value
 */
export function calculateCashAtHand(items: PortfolioItem[]): number {
  return items.reduce((sum, item) => {
    const typeName = item.accountType || '';
    if (CASH_TYPES.includes(typeName) && item.latestBalance?.value) {
      return sum + parseFloat(item.latestBalance.value);
    }
    return sum;
  }, 0);
}

/**
 * Calculate ISA savings value
 */
export function calculateIsaSavings(items: PortfolioItem[]): number {
  return items.reduce((sum, item) => {
    const typeName = item.accountType || '';
    if (ISA_TYPES.includes(typeName) && item.latestBalance?.value) {
      return sum + parseFloat(item.latestBalance.value);
    }
    return sum;
  }, 0);
}

/**
 * Calculate illiquid assets value
 */
export function calculateIlliquid(items: PortfolioItem[]): number {
  return items.reduce((sum, item) => {
    const typeName = item.accountType || '';
    if (ILLIQUID_TYPES.includes(typeName) && item.latestBalance?.value) {
      return sum + parseFloat(item.latestBalance.value);
    }
    return sum;
  }, 0);
}

/**
 * Calculate trust assets value
 */
export function calculateTrustAssets(items: PortfolioItem[]): number {
  return items.reduce((sum, item) => {
    const typeName = item.accountType || '';
    if (TRUST_TYPES.includes(typeName) && item.latestBalance?.value) {
      return sum + parseFloat(item.latestBalance.value);
    }
    return sum;
  }, 0);
}

/**
 * Calculate projected annual GBP yield by applying interest rates (and active bonus rates) to balances.
 * Bonus rate is only included if fixedBonusRateEndDate is absent or in the future.
 */
export function calculateProjectedAnnualYield(items: PortfolioItem[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return items.reduce((sum, item) => {
    const balance = item.latestBalance?.value ? parseFloat(item.latestBalance.value) : 0;
    if (!balance) return sum;

    const baseRate = item.account.interestRate ? parseFloat(item.account.interestRate) : 0;
    if (!baseRate) return sum;

    // Active bonus rate takes precedence over base rate — not additive
    let effectiveRate = baseRate;
    if (item.account.fixedBonusRate) {
      const bonusRate = parseFloat(item.account.fixedBonusRate);
      if (!isNaN(bonusRate) && bonusRate > 0) {
        const endDate = item.account.fixedBonusRateEndDate
          ? new Date(item.account.fixedBonusRateEndDate)
          : null;
        if (!endDate || endDate >= today) {
          effectiveRate = bonusRate;
        }
      }
    }

    return sum + (balance * effectiveRate / 100);
  }, 0);
}
