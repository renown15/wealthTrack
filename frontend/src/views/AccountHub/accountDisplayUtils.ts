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

export function getFixedRateEndDate(item: PortfolioItem): string | null | undefined {
  if ((isDeferredShares(item) || isRSU(item) || isDeferredCash(item)) && item.account.releaseDate) {
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
