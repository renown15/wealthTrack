/**
 * Tooltip text generators for deferred account types
 */

import type { PortfolioItem } from '@/models/WealthTrackDataModels';
import {
  calculateDeferredSharesBalanceDetailedSafe,
  calculateDeferredCashBalanceDetailedSafe,
  calculateRSUBalanceDetailedSafe,
} from '@/utils/deferredSharesCalculator';
import { isDeferredShares, isDeferredCash, isRSU } from '@views/AccountHub/accountDisplayUtils';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

const formatNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-GB').format(num);
};

const toPounds = (value: string | number): number =>
  (typeof value === 'string' ? parseFloat(value) : value) / 100;

export function getDeferredTooltip(item: PortfolioItem): string | undefined {
  if (isDeferredShares(item)) {
    if (item.account.numberOfShares && item.account.price && item.account.purchasePrice) {
      const calc = calculateDeferredSharesBalanceDetailedSafe(
        item.account.numberOfShares,
        item.account.price,
        item.account.purchasePrice
      );
      if (calc) {
        const priceInPounds = toPounds(item.account.price);
        return [
          `Shares: ${formatNumber(item.account.numberOfShares)}`,
          `Price: ${formatCurrency(priceInPounds)}`,
          `Gross Amount: ${formatCurrency(calc.grossAmount)}`,
          `Capital Gains Tax (20%): ${formatCurrency(calc.capitalGainsTax)}`,
        ].join('\n');
      }
    }
  } else if (isDeferredCash(item)) {
    if (item.latestBalance?.value) {
      const valueInPounds = typeof item.latestBalance.value === 'string'
        ? parseFloat(item.latestBalance.value)
        : item.latestBalance.value;
      const calc = calculateDeferredCashBalanceDetailedSafe(
        String(Math.round(valueInPounds * 100))
      );
      if (calc) {
        return [
          `Gross Amount: ${formatCurrency(calc.grossAmount)}`,
          `Discount/Tax (47%): ${formatCurrency(calc.taxDiscount)}`,
        ].join('\n');
      }
    }
  } else if (isRSU(item)) {
    if (item.account.numberOfShares && item.account.price) {
      const calc = calculateRSUBalanceDetailedSafe(
        item.account.numberOfShares,
        item.account.price
      );
      if (calc) {
        const priceInPounds = toPounds(item.account.price);
        return [
          `Shares: ${formatNumber(item.account.numberOfShares)}`,
          `Price: ${formatCurrency(priceInPounds)}`,
          `Gross Amount: ${formatCurrency(calc.grossAmount)}`,
          `Tax Taken (47%): ${formatCurrency(calc.taxTaken)}`,
        ].join('\n');
      }
    }
  }
  return undefined;
}
