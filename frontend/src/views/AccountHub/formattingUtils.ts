/**
 * Formatting utilities for AccountHub table
 */

export function formatCurrency(value?: string | number | null): string {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(numeric)) return '—';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(numeric);
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatInterestRate(fixedBonusRate?: string | null, interestRate?: string | null): string {
  if (fixedBonusRate && interestRate) {
    return `${fixedBonusRate} (${interestRate})`;
  }
  if (fixedBonusRate) {
    return fixedBonusRate;
  }
  if (interestRate) {
    return interestRate;
  }
  return '—';
}

export function parseNumberForEdit(value?: string | number | null): string {
  const numeric = value
    ? typeof value === 'string'
      ? parseFloat(value)
      : value
    : 0;
  if (Number.isNaN(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB').format(numeric);
}

export function parseBalanceForSave(value: string): string {
  return value.trim().replace(/,/g, '');
}
