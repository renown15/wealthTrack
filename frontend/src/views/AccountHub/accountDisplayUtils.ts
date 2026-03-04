/**
 * Account display utilities for AccountHub table
 */

import type { PortfolioItem } from '@/models/WealthTrackDataModels';
import {
  calculateDeferredSharesBalanceSafe,
  calculateDeferredSharesBalanceDetailedSafe,
  calculateDeferredCashBalanceSafe,
  calculateDeferredCashBalanceDetailedSafe,
  calculateRSUBalanceSafe,
  calculateRSUBalanceDetailedSafe,
} from '@/utils/deferredSharesCalculator';

export function isDeferredShares(item: PortfolioItem): boolean {
  return item.accountType === 'Deferred Shares';
}

export function isDeferredCash(item: PortfolioItem): boolean {
  return item.accountType === 'Deferred Cash';
}

export function isRSU(item: PortfolioItem): boolean {
  return item.accountType === 'RSU';
}

export function isDeferredDCPension(item: PortfolioItem): boolean {
  return item.accountType === 'Deferred DC Pension';
}

export function isDeferredDBPension(item: PortfolioItem): boolean {
  return item.accountType === 'Deferred DB Pension';
}

export function getFixedRateEndDate(item: PortfolioItem): string | null | undefined {
  if ((isDeferredShares(item) || isRSU(item) || isDeferredCash(item) || isDeferredDCPension(item) || isDeferredDBPension(item)) && item.account.releaseDate) {
    return item.account.releaseDate;
  }
  return item.account.fixedBonusRateEndDate;
}

export function getEditValue(item: PortfolioItem): string | number | null | undefined {
  if (isDeferredCash(item)) {
    return item.latestBalance?.value;
  }
  return getDisplayBalance(item);
}

export function getDeferredTooltip(item: PortfolioItem): string | undefined {
  if (isDeferredShares(item)) {
    if (item.account.numberOfShares && item.account.price && item.account.purchasePrice) {
      const calculation = calculateDeferredSharesBalanceDetailedSafe(
        item.account.numberOfShares,
        item.account.price,
        item.account.purchasePrice
      );
      if (calculation) {
        const formatCurrency = (value: number): string => {
          return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
          }).format(value);
        };
        const formatNumber = (value: string | number): string => {
          const num = typeof value === 'string' ? parseFloat(value) : value;
          return new Intl.NumberFormat('en-GB').format(num);
        };
        const priceInPounds = (typeof item.account.price === 'string' ? parseFloat(item.account.price) : item.account.price) / 100;
        return `Shares: ${formatNumber(item.account.numberOfShares)}\nPrice: ${formatCurrency(priceInPounds)}\nGross Amount: ${formatCurrency(calculation.grossAmount)}\nCapital Gains Tax (20%): ${formatCurrency(calculation.capitalGainsTax)}`;
      }
    }
  } else if (isDeferredCash(item)) {
    if (item.latestBalance?.value) {
      const valueInPounds = typeof item.latestBalance.value === 'string'
        ? parseFloat(item.latestBalance.value)
        : item.latestBalance.value;
      const balanceInPenceStr = String(Math.round(valueInPounds * 100));
      const calculation = calculateDeferredCashBalanceDetailedSafe(balanceInPenceStr);
      if (calculation) {
        const formatCurrency = (value: number): string => {
          return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
          }).format(value);
        };
        return `Gross Amount: ${formatCurrency(calculation.grossAmount)}\nDiscount/Tax (47%): ${formatCurrency(calculation.taxDiscount)}`;
      }
    }
  } else if (isRSU(item)) {
    if (item.account.numberOfShares && item.account.price) {
      const calculation = calculateRSUBalanceDetailedSafe(
        item.account.numberOfShares,
        item.account.price
      );
      if (calculation) {
        const formatCurrency = (value: number): string => {
          return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
          }).format(value);
        };
        const formatNumber = (value: string | number): string => {
          const num = typeof value === 'string' ? parseFloat(value) : value;
          return new Intl.NumberFormat('en-GB').format(num);
        };
        const priceInPounds = (typeof item.account.price === 'string' ? parseFloat(item.account.price) : item.account.price) / 100;
        return `Shares: ${formatNumber(item.account.numberOfShares)}\nPrice: ${formatCurrency(priceInPounds)}\nGross Amount: ${formatCurrency(calculation.grossAmount)}\nTax Taken (47%): ${formatCurrency(calculation.taxTaken)}`;
      }
    }
  }
  return undefined;
}

const _formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

const _formatDateShort = (date: Date): string =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);

interface EffectiveRate {
  rate: number;
  isBonus: boolean;
  bonusEndDate: Date | null;
}

function _getEffectiveRate(item: PortfolioItem, today: Date): EffectiveRate | null {
  // Active bonus rate takes precedence — not additive to base rate
  if (item.account.fixedBonusRate) {
    const bonusRate = parseFloat(item.account.fixedBonusRate);
    if (!isNaN(bonusRate) && bonusRate > 0) {
      const bonusEndDate = item.account.fixedBonusRateEndDate ? new Date(item.account.fixedBonusRateEndDate) : null;
      if (!bonusEndDate || bonusEndDate >= today) {
        return { rate: bonusRate, isBonus: true, bonusEndDate };
      }
    }
  }

  const baseRate = item.account.interestRate ? parseFloat(item.account.interestRate) : 0;
  if (!baseRate) return null;
  return { rate: baseRate, isBonus: false, bonusEndDate: null };
}

export function getYieldTooltip(item: PortfolioItem): string | undefined {
  const balance = item.latestBalance?.value ? parseFloat(item.latestBalance.value) : 0;
  if (!balance) return undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rates = _getEffectiveRate(item, today);
  if (!rates) return undefined;

  const annualYield = balance * rates.rate / 100;
  const lines: string[] = [`Balance: ${_formatCurrency(balance)}`];

  if (rates.isBonus) {
    const until = rates.bonusEndDate ? ` until ${_formatDateShort(rates.bonusEndDate)}` : ' (ongoing)';
    lines.push(`Bonus Rate: ${rates.rate.toFixed(2)}% (active${until})`);
  } else {
    lines.push(`Base Rate: ${rates.rate.toFixed(2)}%`);
  }

  lines.push('─────────────────');
  lines.push(`Annual Yield: ${_formatCurrency(annualYield)}`);

  return lines.join('\n');
}

export function getGroupYieldTooltip(items: PortfolioItem[]): string | undefined {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const contributions = items.flatMap(item => {
    const balance = item.latestBalance?.value ? parseFloat(item.latestBalance.value) : 0;
    if (!balance) return [];
    const rates = _getEffectiveRate(item, today);
    if (!rates) return [];
    return [{ name: item.account.name, yield: balance * rates.rate / 100 }];
  });

  if (contributions.length === 0) return undefined;

  const total = contributions.reduce((sum, c) => sum + c.yield, 0);
  const lines = contributions.map(c => `${c.name}: ${_formatCurrency(c.yield)}`);
  lines.push('─────────────────');
  lines.push(`Total Annual Yield: ${_formatCurrency(total)}`);

  return lines.join('\n');
}

export function getDisplayBalance(item: PortfolioItem): string | number | null | undefined {
  if (isDeferredShares(item)) {
    if (item.account.numberOfShares && item.account.price && item.account.purchasePrice) {
      const balance = calculateDeferredSharesBalanceSafe(
        item.account.numberOfShares,
        item.account.price,
        item.account.purchasePrice
      );
      if (balance !== null) {
        return balance;
      }
    }
  }
  
  if (isDeferredCash(item)) {
    if (item.latestBalance?.value) {
      const valueInPounds = typeof item.latestBalance.value === 'string'
        ? parseFloat(item.latestBalance.value)
        : item.latestBalance.value;
      const balanceInPenceStr = String(Math.round(valueInPounds * 100));
      const balance = calculateDeferredCashBalanceSafe(balanceInPenceStr);
      if (balance !== null) {
        return balance;
      }
    }
  }

  if (isRSU(item)) {
    if (item.account.numberOfShares && item.account.price) {
      const balance = calculateRSUBalanceSafe(
        item.account.numberOfShares,
        item.account.price
      );
      if (balance !== null) {
        return balance;
      }
    }
  }
  
  return item.latestBalance?.value;
}
