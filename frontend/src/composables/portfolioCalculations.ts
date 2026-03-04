/**
 * Portfolio calculation utilities - computed categories
 */

import type { PortfolioItem } from '@/models/WealthTrackDataModels';

export interface PensionAccountBreakdown {
  name: string;
  institution: string;
  type: 'DC' | 'DB';
  value: number;
  monthlyPayment?: number;
}

export interface PensionBreakdown {
  total: number;
  dcTotal: number;
  dbTotal: number;
  lifeExpectancy: number;
  annuityRate: number;
  accounts: PensionAccountBreakdown[];
}

const DC_PENSION_TYPES = ['Deferred DC Pension', 'SIPP'];
const DB_PENSION_TYPES = ['Deferred DB Pension'];

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

/**
 * Calculate pension capital value.
 *
 * DC pensions: current account balance.
 * DB pensions: present value of annuity = annual_payment × (1 - (1+r)^(-n)) / r
 *   where annual_payment = pensionMonthlyPayment × 12,
 *         r = annuityRate, n = lifeExpectancy (years).
 */
export function calculatePensionValue(
  items: PortfolioItem[],
  lifeExpectancy: number,
  annuityRate: number,
): PensionBreakdown {
  const accounts: PensionAccountBreakdown[] = [];
  let dcTotal = 0;
  let dbTotal = 0;

  for (const item of items) {
    const typeName = item.accountType || '';
    const institutionName = item.institution?.name ?? '';

    if (DC_PENSION_TYPES.includes(typeName)) {
      const value = item.latestBalance?.value ? parseFloat(item.latestBalance.value) : 0;
      dcTotal += value;
      accounts.push({ name: item.account.name, institution: institutionName, type: 'DC', value });
    } else if (DB_PENSION_TYPES.includes(typeName)) {
      const monthly = item.account.pensionMonthlyPayment ? parseFloat(item.account.pensionMonthlyPayment) : 0;
      const annualPayment = monthly * 12;
      const pvFactor = annuityRate > 0
        ? (1 - Math.pow(1 + annuityRate, -lifeExpectancy)) / annuityRate
        : lifeExpectancy;
      const value = annualPayment * pvFactor;
      dbTotal += value;
      accounts.push({ name: item.account.name, institution: institutionName, type: 'DB', value, monthlyPayment: monthly });
    }
  }

  return { total: dcTotal + dbTotal, dcTotal, dbTotal, lifeExpectancy, annuityRate, accounts };
}
