/**
 * Tests for portfolioCalculations composable.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateTotalValue,
  calculateCashAtHand,
  calculateIsaSavings,
  calculateIlliquid,
  calculateTrustAssets,
  calculateProjectedAnnualYield,
  calculatePensionValue,
} from '@composables/portfolioCalculations';
import type { PortfolioItem } from '@/models/WealthTrackDataModels';

const makeItem = (type: string, balance: number | null, overrides: Partial<PortfolioItem['account']> = {}): PortfolioItem => ({
  account: {
    id: 1, userId: 1, institutionId: 1, name: 'Test Account',
    typeId: 1, statusId: 1,
    openedAt: null, closedAt: null,
    createdAt: '2025-01-01', updatedAt: '2025-01-01',
    ...overrides,
  },
  institution: { id: 1, userId: 1, name: 'Test Bank', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  latestBalance: balance !== null ? { id: 1, accountId: 1, userId: 1, eventType: 'Balance Update', value: String(balance), createdAt: '2025-01-01', updatedAt: '2025-01-01' } : null,
  accountType: type,
});

describe('calculateTotalValue', () => {
  it('returns 0 for empty list', () => {
    expect(calculateTotalValue([])).toBe(0);
  });

  it('sums all balances', () => {
    const items = [makeItem('Savings Account', 1000), makeItem('Cash ISA', 2000)];
    expect(calculateTotalValue(items)).toBe(3000);
  });

  it('ignores items with no balance', () => {
    const items = [makeItem('Savings Account', 1000), makeItem('Savings Account', null)];
    expect(calculateTotalValue(items)).toBe(1000);
  });
});

describe('calculateCashAtHand', () => {
  it('returns 0 for empty list', () => {
    expect(calculateCashAtHand([])).toBe(0);
  });

  it('sums cash-type accounts', () => {
    const items = [
      makeItem('Current Account', 500),
      makeItem('Savings Account', 1000),
      makeItem('Premium Bonds', 5000),
      makeItem('Fixed / Bonus Rate Saver', 2000),
      makeItem('Cash ISA', 3000), // not a cash type
    ];
    expect(calculateCashAtHand(items)).toBe(8500);
  });
});

describe('calculateIsaSavings', () => {
  it('sums ISA accounts', () => {
    const items = [
      makeItem('Cash ISA', 10000),
      makeItem('Fixed Rate ISA', 20000),
      makeItem('Stocks ISA', 30000),
      makeItem('Savings Account', 5000), // not ISA
    ];
    expect(calculateIsaSavings(items)).toBe(60000);
  });
});

describe('calculateIlliquid', () => {
  it('sums illiquid assets', () => {
    const items = [
      makeItem('Deferred Shares', 10000),
      makeItem('Deferred Cash', 5000),
      makeItem('RSU', 8000),
      makeItem('Savings Account', 1000), // not illiquid
    ];
    expect(calculateIlliquid(items)).toBe(23000);
  });
});

describe('calculateTrustAssets', () => {
  it('sums trust accounts', () => {
    const items = [
      makeItem('Trust Bank Account', 50000),
      makeItem('Trust Stocks Investment Account', 75000),
      makeItem('Savings Account', 1000), // not trust
    ];
    expect(calculateTrustAssets(items)).toBe(125000);
  });
});

describe('calculateProjectedAnnualYield', () => {
  it('returns 0 for items with no interest rate', () => {
    const items = [makeItem('Savings Account', 10000)];
    expect(calculateProjectedAnnualYield(items)).toBe(0);
  });

  it('calculates yield using base rate', () => {
    const items = [makeItem('Savings Account', 10000, { interestRate: '5' })];
    expect(calculateProjectedAnnualYield(items)).toBe(500);
  });

  it('uses bonus rate when active (no end date)', () => {
    const items = [makeItem('Savings Account', 10000, { interestRate: '2', fixedBonusRate: '5' })];
    expect(calculateProjectedAnnualYield(items)).toBe(500);
  });

  it('uses base rate when bonus rate has expired', () => {
    const items = [makeItem('Savings Account', 10000, {
      interestRate: '2',
      fixedBonusRate: '5',
      fixedBonusRateEndDate: '2020-01-01',
    })];
    expect(calculateProjectedAnnualYield(items)).toBe(200);
  });
});

describe('calculatePensionValue', () => {
  it('returns zero breakdown for empty items', () => {
    const result = calculatePensionValue([], 36, 0.075);
    expect(result.total).toBe(0);
    expect(result.dcTotal).toBe(0);
    expect(result.dbTotal).toBe(0);
    expect(result.accounts).toHaveLength(0);
  });

  it('calculates DC pension from balance', () => {
    const items = [makeItem('Deferred DC Pension', 50000)];
    const result = calculatePensionValue(items, 36, 0.075);
    expect(result.dcTotal).toBe(50000);
    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0].type).toBe('DC');
    expect(result.accounts[0].value).toBe(50000);
  });

  it('calculates SIPP as DC pension', () => {
    const items = [makeItem('SIPP', 100000)];
    const result = calculatePensionValue(items, 36, 0.075);
    expect(result.dcTotal).toBe(100000);
  });

  it('calculates DB pension using annuity formula', () => {
    const items = [makeItem('Deferred DB Pension', 0, { pensionMonthlyPayment: '1000' })];
    const result = calculatePensionValue(items, 36, 0.075);
    expect(result.dbTotal).toBeGreaterThan(0);
    expect(result.accounts[0].type).toBe('DB');
    expect(result.accounts[0].monthlyPayment).toBe(1000);
  });

  it('uses lifeExpectancy as pvFactor when annuityRate is 0', () => {
    const items = [makeItem('Deferred DB Pension', 0, { pensionMonthlyPayment: '1000' })];
    const result = calculatePensionValue(items, 20, 0);
    // annualPayment = 1000 * 12 = 12000; pvFactor = 20; value = 240000
    expect(result.dbTotal).toBe(240000);
  });

  it('totals DC and DB pensions', () => {
    const items = [
      makeItem('Deferred DC Pension', 50000),
      makeItem('Deferred DB Pension', 0, { pensionMonthlyPayment: '500' }),
    ];
    const result = calculatePensionValue(items, 36, 0.075);
    expect(result.total).toBe(result.dcTotal + result.dbTotal);
    expect(result.accounts).toHaveLength(2);
  });

  it('ignores non-pension account types', () => {
    const items = [makeItem('Savings Account', 10000)];
    const result = calculatePensionValue(items, 36, 0.075);
    expect(result.total).toBe(0);
    expect(result.accounts).toHaveLength(0);
  });
});
