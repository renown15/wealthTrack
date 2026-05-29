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
  getDeferredTooltip, getYieldTooltip, getGroupYieldTooltip,
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

describe('getDeferredTooltip', () => {
  it('returns undefined for regular account', () => {
    expect(getDeferredTooltip(makeItem())).toBeUndefined();
  });

  it('returns deferred shares tooltip with full fields', () => {
    mockCalc.calculateDeferredSharesBalanceDetailedSafe.mockReturnValue({
      balance: 200, grossAmount: 400, capitalGainsTax: 80,
    });
    const item = makeItem({ accountType: 'Deferred Shares' });
    item.account.numberOfShares = '100';
    item.account.price = '400';
    item.account.purchasePrice = '200';
    const result = getDeferredTooltip(item);
    expect(result).toContain('Shares:');
    expect(result).toContain('Gross Amount:');
  });

  it('returns deferred cash tooltip when balance set', () => {
    mockCalc.calculateDeferredCashBalanceDetailedSafe.mockReturnValue({
      balance: 530, grossAmount: 1000, taxDiscount: 470,
    });
    const result = getDeferredTooltip(makeItem({ accountType: 'Deferred Cash' }));
    expect(result).toContain('Gross Amount:');
    expect(result).toContain('Discount/Tax');
  });

  it('returns RSU tooltip with full fields', () => {
    mockCalc.calculateRSUBalanceDetailedSafe.mockReturnValue({
      balance: 530, grossAmount: 1000, taxTaken: 470,
    });
    const item = makeItem({ accountType: 'RSU' });
    item.account.numberOfShares = '50';
    item.account.price = '2000';
    const result = getDeferredTooltip(item);
    expect(result).toContain('Tax Taken');
  });
});

describe('getYieldTooltip', () => {
  it('returns undefined when no balance', () => {
    const item = makeItem();
    item.latestBalance = null;
    expect(getYieldTooltip(item)).toBeUndefined();
  });

  it('returns undefined when no interest rate', () => {
    const item = makeItem();
    item.account.interestRate = null;
    expect(getYieldTooltip(item)).toBeUndefined();
  });

  it('returns tooltip with base rate', () => {
    const result = getYieldTooltip(makeItem());
    expect(result).toContain('Base Rate:');
    expect(result).toContain('Annual Yield:');
  });

  it('returns bonus rate tooltip when active bonus set', () => {
    const item = makeItem();
    item.account.fixedBonusRate = '6';
    item.account.fixedBonusRateEndDate = '2099-01-01';
    expect(getYieldTooltip(item)).toContain('Bonus Rate:');
  });

  it('returns base rate when bonus is expired', () => {
    const item = makeItem();
    item.account.fixedBonusRate = '6';
    item.account.fixedBonusRateEndDate = '2000-01-01';
    expect(getYieldTooltip(item)).toContain('Base Rate:');
  });
});

describe('getGroupYieldTooltip', () => {
  it('returns undefined for empty array', () => {
    expect(getGroupYieldTooltip([])).toBeUndefined();
  });

  it('returns undefined when no items have balance + rate', () => {
    const item = makeItem();
    item.latestBalance = null;
    expect(getGroupYieldTooltip([item])).toBeUndefined();
  });

  it('returns combined yield tooltip for multiple items', () => {
    const item1 = makeItem();
    const item2 = makeItem();
    item2.account.name = 'Other Account';
    expect(getGroupYieldTooltip([item1, item2])).toContain('Total Annual Yield:');
  });
});
