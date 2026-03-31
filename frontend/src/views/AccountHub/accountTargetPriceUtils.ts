/**
 * Helpers for appending target price lines to share tooltip arrays.
 */

import { calculateDeferredSharesBalanceDetailedSafe } from '@/utils/deferredSharesCalculator';
import type { PortfolioItem } from '@/models/WealthTrackDataModels';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

const toPounds = (value: string | number): number =>
  (typeof value === 'string' ? parseFloat(value) : value) / 100;

/**
 * Append a target price net balance line to an existing tooltip lines array.
 * No-op if targetPrice or purchasePrice is absent, or if the calc returns null.
 */
export function appendTargetPriceLine(
  lines: string[],
  numberOfShares: string,
  targetPrice: string | null | undefined,
  purchasePrice: string | null | undefined,
): void {
  if (!targetPrice || !purchasePrice) return;
  const calc = calculateDeferredSharesBalanceDetailedSafe(numberOfShares, targetPrice, purchasePrice);
  if (!calc) return;
  lines.push(`At target (${formatCurrency(toPounds(targetPrice))}): ${formatCurrency(calc.balance)} net`);
}

/**
 * Append a grouped target price net balance line.
 * Uses the first item's targetPrice (all items share the same underlying).
 */
export function appendGroupTargetPriceLine(lines: string[], items: PortfolioItem[]): void {
  const targetPrice = items[0]?.account.targetPrice;
  if (!targetPrice) return;
  let totalNet = 0;
  let hasData = false;
  for (const item of items) {
    if (item.account.numberOfShares && item.account.purchasePrice) {
      const calc = calculateDeferredSharesBalanceDetailedSafe(
        item.account.numberOfShares, targetPrice, item.account.purchasePrice,
      );
      if (calc) { totalNet += calc.balance; hasData = true; }
    }
  }
  if (!hasData) return;
  lines.push(`At target (${formatCurrency(toPounds(targetPrice))}): ${formatCurrency(totalNet)} net`);
}
