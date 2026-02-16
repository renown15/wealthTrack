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
