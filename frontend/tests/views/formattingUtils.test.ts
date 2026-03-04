import { describe, it, expect } from 'vitest';
import { formatDate, formatCurrency, formatInterestRate } from '@/views/AccountHub/formattingUtils';

describe('formatDate', () => {
  it('formats DD/MM/YYYY as dd mmm yyyy', () => {
    expect(formatDate('12/03/2026')).toBe('12 Mar 2026');
    expect(formatDate('01/01/2025')).toBe('01 Jan 2025');
    expect(formatDate('31/12/2030')).toBe('31 Dec 2030');
  });

  it('formats YYYY-MM-DD as dd mmm yyyy', () => {
    expect(formatDate('2026-03-12')).toBe('12 Mar 2026');
    expect(formatDate('2025-01-01')).toBe('01 Jan 2025');
    expect(formatDate('2030-12-31')).toBe('31 Dec 2030');
  });

  it('returns em-dash for null/undefined', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('')).toBe('—');
  });

  it('returns em-dash for invalid dates', () => {
    expect(formatDate('invalid')).toBe('—');
    expect(formatDate('99/99/9999')).toBe('—');
  });
});

describe('formatCurrency', () => {
  it('formats currency with 2 decimal places', () => {
    expect(formatCurrency(1234.56)).toBe('£1,234.56');
    expect(formatCurrency(1000)).toBe('£1,000.00');
    expect(formatCurrency(0.99)).toBe('£0.99');
  });

  it('handles negative values', () => {
    expect(formatCurrency(-1234.56)).toBe('-£1,234.56');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('£0.00');
  });

  it('returns em-dash for null/undefined', () => {
    expect(formatCurrency(null)).toBe('—');
    expect(formatCurrency(undefined)).toBe('—');
  });
});

describe('formatInterestRate', () => {
  it('formats single interest rate with 2 decimal places', () => {
    expect(formatInterestRate('4.5')).toBe('4.50%');
    expect(formatInterestRate('0.25')).toBe('0.25%');
    expect(formatInterestRate('5')).toBe('5.00%');
  });

  it('formats base and bonus rates together', () => {
    expect(formatInterestRate('4.5', '2.0')).toBe('4.50% (2.00%)');
    expect(formatInterestRate('0.5', '0.25')).toBe('0.50% (0.25%)');
  });

  it('returns em-dash for null/undefined', () => {
    expect(formatInterestRate(null)).toBe('—');
    expect(formatInterestRate(undefined)).toBe('—');
    expect(formatInterestRate(null, null)).toBe('—');
  });

  it('handles zero rates', () => {
    expect(formatInterestRate('0')).toBe('0.00%');
    expect(formatInterestRate('0', '0')).toBe('0.00% (0.00%)');
  });

  it('handles number inputs by converting to string', () => {
    expect(formatInterestRate('4.567')).toBe('4.57%');
    expect(formatInterestRate('2.341', '1.892')).toBe('2.34% (1.89%)');
  });
});
