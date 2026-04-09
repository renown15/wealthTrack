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

export function formatShortDate(value?: string | null): string {
  if (!value) return '—';
  let isoDate = value;
  if (value.includes('/')) {
    const parts = value.split('/');
    if (parts.length === 3) isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(date);
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  
  // Handle both DD/MM/YYYY and YYYY-MM-DD formats from backend
  let isoDate = value;
  if (value.includes('/')) {
    // Convert DD/MM/YYYY to YYYY-MM-DD
    const parts = value.split('/');
    if (parts.length === 3) {
      isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  
  // Display as dd mmm yyyy (e.g., "12 Mar 2026")
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatInterestRate(fixedBonusRate?: string | null, interestRate?: string | null): string {
  const formatRate = (rate: string | null | undefined): string => {
    if (!rate) return '';
    const numeric = parseFloat(rate);
    if (Number.isNaN(numeric)) return '';
    return numeric.toFixed(2);
  };

  const bonus = formatRate(fixedBonusRate);
  const interest = formatRate(interestRate);

  if (bonus && interest) {
    return `${bonus}% (${interest}%)`;
  }
  if (bonus) {
    return `${bonus}%`;
  }
  if (interest) {
    return `${interest}%`;
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
