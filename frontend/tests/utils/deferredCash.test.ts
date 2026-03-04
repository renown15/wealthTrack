import { describe, it, expect } from 'vitest';
import {
  calculateDeferredCashBalanceDetailed,
  calculateDeferredCashBalance,
  calculateDeferredCashBalanceDetailedSafe,
  calculateDeferredCashBalanceSafe,
} from '@utils/deferredCash';

describe('calculateDeferredCashBalanceDetailed', () => {
  it('returns 47% discount calculation for positive balance', () => {
    const result = calculateDeferredCashBalanceDetailed(10000);
    expect(result.grossAmount).toBeCloseTo(100);
    expect(result.taxDiscount).toBeCloseTo(47);
    expect(result.balance).toBeCloseTo(53);
  });

  it('returns zeros for negative balance', () => {
    const result = calculateDeferredCashBalanceDetailed(-100);
    expect(result.balance).toBe(0);
    expect(result.grossAmount).toBe(0);
    expect(result.taxDiscount).toBe(0);
  });

  it('returns zeros for zero balance', () => {
    const result = calculateDeferredCashBalanceDetailed(0);
    expect(result.grossAmount).toBe(0);
    expect(result.balance).toBe(0);
    expect(result.taxDiscount).toBe(0);
  });
});

describe('calculateDeferredCashBalance', () => {
  it('returns the discounted balance', () => {
    expect(calculateDeferredCashBalance(10000)).toBeCloseTo(53);
  });

  it('returns 0 for negative input', () => {
    expect(calculateDeferredCashBalance(-1)).toBe(0);
  });
});

describe('calculateDeferredCashBalanceDetailedSafe', () => {
  it('parses string and returns calculation', () => {
    const result = calculateDeferredCashBalanceDetailedSafe('10000');
    expect(result).not.toBeNull();
    expect(result!.grossAmount).toBeCloseTo(100);
  });

  it('returns null for null input', () => {
    expect(calculateDeferredCashBalanceDetailedSafe(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(calculateDeferredCashBalanceDetailedSafe(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(calculateDeferredCashBalanceDetailedSafe('')).toBeNull();
  });

  it('returns null for non-numeric string', () => {
    expect(calculateDeferredCashBalanceDetailedSafe('abc')).toBeNull();
  });
});

describe('calculateDeferredCashBalanceSafe', () => {
  it('returns the discounted balance from string', () => {
    expect(calculateDeferredCashBalanceSafe('10000')).toBeCloseTo(53);
  });

  it('returns null for null input', () => {
    expect(calculateDeferredCashBalanceSafe(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(calculateDeferredCashBalanceSafe(undefined)).toBeNull();
  });

  it('returns null for non-numeric string', () => {
    expect(calculateDeferredCashBalanceSafe('xyz')).toBeNull();
  });
});
