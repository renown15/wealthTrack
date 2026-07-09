import { describe, it, expect } from 'vitest';
import {
  parseUkDate,
  predictedPeriodCost,
  predictedAnnualCost,
  computePredictedAnnualTotal,
  paymentsPerYear,
  annualCost,
} from '@composables/outgoingBudget';
import type { PortfolioItem } from '@models/WealthTrackDataModels';

function makeItem(account: Record<string, unknown>): PortfolioItem {
  return { account: { id: 1, name: 'Test', ...account } } as unknown as PortfolioItem;
}

function ukDateFromToday(days: number): string {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

describe('parseUkDate', () => {
  it('parses DD/MM/YYYY', () => {
    const d = parseUkDate('15/06/2026');
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(5);
    expect(d?.getDate()).toBe(15);
  });

  it('returns null for empty, malformed, or invalid input', () => {
    expect(parseUkDate(null)).toBeNull();
    expect(parseUkDate('')).toBeNull();
    expect(parseUkDate('2026-06-15')).toBeNull();
    expect(parseUkDate('aa/bb/cccc')).toBeNull();
  });
});

describe('paymentsPerYear / annualCost', () => {
  it('maps renewal cadences and defaults to monthly', () => {
    expect(paymentsPerYear('Monthly')).toBe(12);
    expect(paymentsPerYear('Termly')).toBe(3);
    expect(paymentsPerYear('One-off')).toBe(0);
    expect(paymentsPerYear(null)).toBe(12);
  });

  it('annualises the fixed cost', () => {
    expect(annualCost(makeItem({ monthlyCost: '100', renewalType: 'Quarterly' }))).toBe(400);
    expect(annualCost(makeItem({ monthlyCost: null }))).toBe(0);
  });
});

describe('predictedPeriodCost', () => {
  it('uses the projection for Provision items', () => {
    const item = makeItem({ costingMethod: 'Provision', monthlyCost: '50' });
    expect(predictedPeriodCost(item, '80.25')).toBe(80.25);
  });

  it('falls back to the fixed cost when there is no projection', () => {
    const item = makeItem({ costingMethod: 'Provision', monthlyCost: '50' });
    expect(predictedPeriodCost(item)).toBe(50);
  });

  it('ignores projections for Fixed items', () => {
    const item = makeItem({ costingMethod: 'Fixed', monthlyCost: '50' });
    expect(predictedPeriodCost(item, '80.25')).toBe(50);
  });
});

describe('predictedAnnualCost', () => {
  it('annualises by renewal type without an end date', () => {
    const item = makeItem({ monthlyCost: '100', renewalType: 'Monthly' });
    expect(predictedAnnualCost(item)).toBe(1200);
  });

  it('returns 0 once the end date has passed', () => {
    const item = makeItem({
      monthlyCost: '100', renewalType: 'Monthly', outgoingEndDate: ukDateFromToday(-10),
    });
    expect(predictedAnnualCost(item)).toBe(0);
  });

  it('prorates when the outgoing ends within the next year', () => {
    const item = makeItem({
      monthlyCost: '100', renewalType: 'Monthly',
      outgoingEndDate: ukDateFromToday(Math.round(365 / 2)),
    });
    const predicted = predictedAnnualCost(item);
    expect(predicted).toBeGreaterThan(500);
    expect(predicted).toBeLessThan(700);
  });

  it('does not prorate when the end date is over a year away (school fees)', () => {
    const item = makeItem({
      monthlyCost: '3000', renewalType: 'Termly', outgoingEndDate: ukDateFromToday(365 * 5),
    });
    expect(predictedAnnualCost(item)).toBe(9000);
  });

  it('uses the projection for Provision items', () => {
    const item = makeItem({
      costingMethod: 'Provision', monthlyCost: '10', renewalType: 'Quarterly',
    });
    expect(predictedAnnualCost(item, '150.00')).toBe(600);
  });
});

describe('computePredictedAnnualTotal', () => {
  it('sums predictions using per-account projections', () => {
    const items = [
      makeItem({ id: 1, costingMethod: 'Provision', monthlyCost: '10', renewalType: 'Monthly' }),
      makeItem({ id: 2, monthlyCost: '100', renewalType: 'Annually' }),
      makeItem({ id: 3, monthlyCost: '50', renewalType: 'Monthly', outgoingEndDate: ukDateFromToday(-1) }),
    ];
    const total = computePredictedAnnualTotal(items, { 1: '20' });
    // 20×12 (projected) + 100×1 (fixed annual) + 0 (ended)
    expect(total).toBe(340);
  });
});
