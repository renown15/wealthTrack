import { describe, it, expect } from 'vitest';
import {
  calculateRSUBalanceDetailed,
  calculateRSUBalance,
  calculateRSUBalanceDetailedSafe,
  calculateRSUBalanceSafe,
} from '@utils/rsu';

describe('calculateRSUBalanceDetailed', () => {
  it('calculates RSU with 47% tax', () => {
    // 100 shares at 1000 pence each = 100,000 pence gross
    const result = calculateRSUBalanceDetailed(100, 1000);
    expect(result.grossAmount).toBeCloseTo(1000);
    expect(result.taxTaken).toBeCloseTo(470);
    expect(result.balance).toBeCloseTo(530);
  });

  it('returns zeros for zero shares', () => {
    const result = calculateRSUBalanceDetailed(0, 500);
    expect(result.grossAmount).toBe(0);
    expect(result.taxTaken).toBe(0);
    expect(result.balance).toBe(0);
  });

  it('returns zeros for zero price', () => {
    const result = calculateRSUBalanceDetailed(50, 0);
    expect(result.grossAmount).toBe(0);
    expect(result.balance).toBe(0);
  });
});

describe('calculateRSUBalance', () => {
  it('returns the net balance after 47% tax', () => {
    expect(calculateRSUBalance(100, 1000)).toBeCloseTo(530);
  });

  it('returns 0 for zero shares', () => {
    expect(calculateRSUBalance(0, 1000)).toBe(0);
  });
});

describe('calculateRSUBalanceDetailedSafe', () => {
  it('parses strings and returns calculation', () => {
    const result = calculateRSUBalanceDetailedSafe('100', '1000');
    expect(result).not.toBeNull();
    expect(result!.grossAmount).toBeCloseTo(1000);
  });

  it('returns null when shares is null', () => {
    expect(calculateRSUBalanceDetailedSafe(null, '1000')).toBeNull();
  });

  it('returns null when price is null', () => {
    expect(calculateRSUBalanceDetailedSafe('100', null)).toBeNull();
  });

  it('returns null when shares is undefined', () => {
    expect(calculateRSUBalanceDetailedSafe(undefined, '1000')).toBeNull();
  });

  it('returns null for non-numeric shares', () => {
    expect(calculateRSUBalanceDetailedSafe('abc', '1000')).toBeNull();
  });

  it('returns null for non-numeric price', () => {
    expect(calculateRSUBalanceDetailedSafe('100', 'xyz')).toBeNull();
  });
});

describe('calculateRSUBalanceSafe', () => {
  it('returns net balance from string inputs', () => {
    expect(calculateRSUBalanceSafe('100', '1000')).toBeCloseTo(530);
  });

  it('returns null when inputs are missing', () => {
    expect(calculateRSUBalanceSafe(null, null)).toBeNull();
  });

  it('returns null for invalid input', () => {
    expect(calculateRSUBalanceSafe('abc', '1000')).toBeNull();
  });
});
