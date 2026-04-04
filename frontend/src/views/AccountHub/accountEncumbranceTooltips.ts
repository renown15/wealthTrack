/**
 * Tooltip generators for account encumbrance display
 */

import type { PortfolioItem } from '@/models/WealthTrackDataModels';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

export function getEncumbranceTooltip(item: PortfolioItem): string | undefined {
  if (!item.account.encumbrance || !item.latestBalance?.grossBalance) {
    return undefined;
  }

  const encumbrance = parseFloat(item.account.encumbrance);
  const grossBalance = parseFloat(item.latestBalance.grossBalance);

  if (encumbrance <= 0 || isNaN(encumbrance) || isNaN(grossBalance)) {
    return undefined;
  }

  const netBalance = grossBalance - encumbrance;
  return [
    `Gross: ${formatCurrency(grossBalance)}`,
    `Encumbrance: ${formatCurrency(encumbrance)}`,
    '────────────',
    `Net Balance: ${formatCurrency(netBalance)}`,
  ].join('\n');
}

export function getGroupEncumbranceTooltip(items: PortfolioItem[]): string | undefined {
  const encumberedItems = items.filter(item => item.account.encumbrance && parseFloat(item.account.encumbrance) > 0);
  if (encumberedItems.length === 0) return undefined;

  const totalGross = encumberedItems.reduce((sum, item) => {
    const gross = item.latestBalance?.grossBalance ? parseFloat(item.latestBalance.grossBalance) : 0;
    return sum + (isNaN(gross) ? 0 : gross);
  }, 0);

  const totalEncumbrance = encumberedItems.reduce((sum, item) => {
    const enc = item.account.encumbrance ? parseFloat(item.account.encumbrance) : 0;
    return sum + (isNaN(enc) ? 0 : enc);
  }, 0);

  if (totalEncumbrance <= 0) return undefined;

  const totalNet = totalGross - totalEncumbrance;
  return [
    `Group Gross: ${formatCurrency(totalGross)}`,
    `Encumbrances (${encumberedItems.length}): ${formatCurrency(totalEncumbrance)}`,
    '──────────────┬',
    `Group Net: ${formatCurrency(totalNet)}`,
  ].join('\n');
}
