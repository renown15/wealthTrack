/**
 * Tooltip text generators for deferred account types
 */

import type { PortfolioItem } from '@/models/WealthTrackDataModels';
import {
  calculateDeferredSharesBalanceDetailedSafe,
  calculateDeferredCashBalanceDetailedSafe,
  calculateRSUBalanceDetailedSafe,
} from '@/utils/deferredSharesCalculator';
import {
  isDeferredShares,
  isDeferredCash,
  isRSU,
  isShares,
} from '@views/AccountHub/accountDisplayUtils';
import { appendTargetPriceLine, appendGroupTargetPriceLine } from '@views/AccountHub/accountTargetPriceUtils';

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
        item.account.numberOfShares, item.account.price, item.account.purchasePrice
      );
      if (calc) {
        const lines = [
          `Shares: ${formatNumber(item.account.numberOfShares)}`,
          `Price: ${formatCurrency(toPounds(item.account.price))}`,
          `Gross Amount: ${formatCurrency(calc.grossAmount)}`,
          `Capital Gains Tax (20%): ${formatCurrency(calc.capitalGainsTax)}`,
        ];
        appendTargetPriceLine(lines, item.account.numberOfShares, item.account.targetPrice, item.account.purchasePrice);
        return lines.join('\n');
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
  } else if (isShares(item)) {
    if (item.account.numberOfShares && item.account.price && item.account.purchasePrice) {
      const calc = calculateDeferredSharesBalanceDetailedSafe(
        item.account.numberOfShares, item.account.price, item.account.purchasePrice
      );
      if (calc) {
        const lines = [
          `Shares: ${formatNumber(item.account.numberOfShares)}`,
          `Price: ${formatCurrency(toPounds(item.account.price))}`,
          `Gross Amount: ${formatCurrency(calc.grossAmount)}`,
          `Capital Gains Tax (20%): ${formatCurrency(calc.capitalGainsTax)}`,
        ];
        appendTargetPriceLine(lines, item.account.numberOfShares, item.account.targetPrice, item.account.purchasePrice);
        return lines.join('\n');
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

export function getGroupDeferredTooltip(items: PortfolioItem[]): string | undefined {
  if (items.length === 0) return undefined;

  const first = items[0];

  if (isRSU(first)) {
    let totalShares = 0;
    let totalGross = 0;
    let totalTax = 0;
    let hasData = false;

    for (const item of items) {
      if (item.account.numberOfShares && item.account.price) {
        const calc = calculateRSUBalanceDetailedSafe(
          item.account.numberOfShares,
          item.account.price
        );
        if (calc) {
          totalShares += parseFloat(item.account.numberOfShares);
          totalGross += calc.grossAmount;
          totalTax += calc.taxTaken;
          hasData = true;
        }
      }
    }

    if (!hasData) return undefined;
    return [
      `Shares: ${formatNumber(totalShares)}`,
      `Gross Amount: ${formatCurrency(totalGross)}`,
      `Tax Taken (47%): ${formatCurrency(totalTax)}`,
    ].join('\n');
  }

  if (isDeferredShares(first) || isShares(first)) {
    let totalShares = 0;
    let totalGross = 0;
    let totalCGT = 0;
    let hasData = false;

    for (const item of items) {
      if (item.account.numberOfShares && item.account.price && item.account.purchasePrice) {
        const calc = calculateDeferredSharesBalanceDetailedSafe(
          item.account.numberOfShares,
          item.account.price,
          item.account.purchasePrice
        );
        if (calc) {
          totalShares += parseFloat(item.account.numberOfShares);
          totalGross += calc.grossAmount;
          totalCGT += calc.capitalGainsTax;
          hasData = true;
        }
      }
    }

    if (!hasData) return undefined;
    const lines = [
      `Shares: ${formatNumber(totalShares)}`,
      `Gross Amount: ${formatCurrency(totalGross)}`,
      `Capital Gains Tax (20%): ${formatCurrency(totalCGT)}`,
    ];
    appendGroupTargetPriceLine(lines, items);
    return lines.join('\n');
  }

  if (isDeferredCash(first)) {
    let totalGross = 0;
    let totalDiscount = 0;
    let hasData = false;

    for (const item of items) {
      if (item.latestBalance?.value) {
        const valueInPounds = typeof item.latestBalance.value === 'string'
          ? parseFloat(item.latestBalance.value)
          : item.latestBalance.value;
        const calc = calculateDeferredCashBalanceDetailedSafe(
          String(Math.round(valueInPounds * 100))
        );
        if (calc) {
          totalGross += calc.grossAmount;
          totalDiscount += calc.taxDiscount;
          hasData = true;
        }
      }
    }

    if (!hasData) return undefined;
    return [
      `Gross Amount: ${formatCurrency(totalGross)}`,
      `Discount/Tax (47%): ${formatCurrency(totalDiscount)}`,
    ].join('\n');
  }

  return undefined;
}
