import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PortfolioItem } from '@models/WealthTrackDataModels';

vi.mock('@/utils/deferredSharesCalculator', () => ({
  calculateDeferredSharesBalanceSafe: vi.fn(),
  calculateDeferredSharesBalanceDetailedSafe: vi.fn(),
  calculateDeferredCashBalanceSafe: vi.fn(),
  calculateDeferredCashBalanceDetailedSafe: vi.fn(),
  calculateRSUBalanceSafe: vi.fn(),
  calculateRSUBalanceDetailedSafe: vi.fn(),
}));

import {
  isDeferredShares, isDeferredCash, isRSU,
  getFixedRateEndDate, getEditValue, getDisplayBalance,
} from '@views/AccountHub/accountDisplayUtils';

import * as calc from '@/utils/deferredSharesCalculator';

const mockCalc = vi.mocked(calc);

const makeItem = (overrides: Partial<PortfolioItem> = {}): PortfolioItem => ({
  account: {
    id: 1, userId: 1, institutionId: 1, name: 'Test', typeId: 1, statusId: 1,
    openedAt: null, closedAt: null, accountNumber: null, sortCode: null,
    rollRefNumber: null, interestRate: '5', fixedBonusRate: null,
    fixedBonusRateEndDate: null, releaseDate: null, numberOfShares: null,
    underlying: null, price: null, purchasePrice: null, pensionMonthlyPayment: null,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  institution: null,
  latestBalance: { id: 1, accountId: 1, userId: 1, eventType: 'balance', value: '1000', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  accountType: 'Cash ISA',
  ...overrides,
});

beforeEach(() => { vi.clearAllMocks(); });

describe('isDeferredShares / isDeferredCash / isRSU', () => {
  it('isDeferredShares returns true for Deferred Shares type', () => {
    expect(isDeferredShares(makeItem({ accountType: 'Deferred Shares' }))).toBe(true);
    expect(isDeferredShares(makeItem({ accountType: 'Cash ISA' }))).toBe(false);
  });

  it('isDeferredCash returns true for Deferred Cash type', () => {
    expect(isDeferredCash(makeItem({ accountType: 'Deferred Cash' }))).toBe(true);
    expect(isDeferredCash(makeItem())).toBe(false);
  });

  it('isRSU returns true for RSU type', () => {
    expect(isRSU(makeItem({ accountType: 'RSU' }))).toBe(true);
    expect(isRSU(makeItem())).toBe(false);
  });
});

describe('getFixedRateEndDate', () => {
  it('returns releaseDate for deferred shares', () => {
    const item = makeItem({ accountType: 'Deferred Shares' });
    item.account.releaseDate = '2025-12-31';
    expect(getFixedRateEndDate(item)).toBe('2025-12-31');
  });

  it('returns releaseDate for RSU', () => {
    const item = makeItem({ accountType: 'RSU' });
    item.account.releaseDate = '2025-06-15';
    expect(getFixedRateEndDate(item)).toBe('2025-06-15');
  });

  it('returns releaseDate for Deferred Cash', () => {
    const item = makeItem({ accountType: 'Deferred Cash' });
    item.account.releaseDate = '2026-03-01';
    expect(getFixedRateEndDate(item)).toBe('2026-03-01');
  });

  it('returns releaseDate for Deferred DC Pension', () => {
    const item = makeItem({ accountType: 'Deferred DC Pension' });
    item.account.releaseDate = '2030-01-01';
    expect(getFixedRateEndDate(item)).toBe('2030-01-01');
  });

  it('returns releaseDate for Deferred DB Pension', () => {
    const item = makeItem({ accountType: 'Deferred DB Pension' });
    item.account.releaseDate = '2028-06-30';
    expect(getFixedRateEndDate(item)).toBe('2028-06-30');
  });

  it('returns fixedBonusRateEndDate for standard accounts', () => {
    const item = makeItem();
    item.account.fixedBonusRateEndDate = '2025-06-30';
    expect(getFixedRateEndDate(item)).toBe('2025-06-30');
  });

  it('returns null when no dates set', () => {
    expect(getFixedRateEndDate(makeItem())).toBeNull();
  });
});

describe('getEditValue', () => {
  it('returns latestBalance.value for deferred cash', () => {
    expect(getEditValue(makeItem({ accountType: 'Deferred Cash' }))).toBe('1000');
  });

  it('returns getDisplayBalance for non-deferred-cash', () => {
    const item = makeItem();
    item.latestBalance!.value = '5000';
    expect(getEditValue(item)).toBe('5000');
  });
});

describe('getDisplayBalance', () => {
  it('returns latestBalance.value for regular account', () => {
    expect(getDisplayBalance(makeItem())).toBe('1000');
  });

  it('returns deferred shares balance when all fields present', () => {
    mockCalc.calculateDeferredSharesBalanceSafe.mockReturnValue(200);
    const item = makeItem({ accountType: 'Deferred Shares' });
    item.account.numberOfShares = '100';
    item.account.price = '400';
    item.account.purchasePrice = '200';
    expect(getDisplayBalance(item)).toBe(200);
  });

  it('falls through to latestBalance for deferred shares with missing fields', () => {
    expect(getDisplayBalance(makeItem({ accountType: 'Deferred Shares' }))).toBe('1000');
  });

  it('returns deferred cash balance when latestBalance set', () => {
    mockCalc.calculateDeferredCashBalanceSafe.mockReturnValue(530);
    expect(getDisplayBalance(makeItem({ accountType: 'Deferred Cash' }))).toBe(530);
  });

  it('returns RSU balance when shares and price present', () => {
    mockCalc.calculateRSUBalanceSafe.mockReturnValue(430);
    const item = makeItem({ accountType: 'RSU' });
    item.account.numberOfShares = '50';
    item.account.price = '1000';
    expect(getDisplayBalance(item)).toBe(430);
  });
});
