import { describe, it, expect } from 'vitest';
import { searchAndSortOutgoings, computeOutgoingsStats } from '@composables/useOutgoings';

const mk = (name: string, type: string, inst: string | null, acctNo: string | null = null): never =>
  ({
    account: { name, accountNumber: acctNo, sortCode: null },
    institution: inst ? { name: inst } : null,
    accountType: type,
  } as never);

describe('searchAndSortOutgoings', () => {
  it('sorts by type, then provider, then account name', () => {
    const items = [
      mk('B', 'Subscription', 'Netflix'),
      mk('A', 'Utility - Gas', 'British Gas'),
      mk('C', 'Utility - Gas', 'Aviva'),
    ];
    // Subscription < Utility; within Utility: Aviva < British Gas
    expect(searchAndSortOutgoings(items, '').map((i) => i.account.name)).toEqual(['B', 'C', 'A']);
  });

  it('filters by name, provider, type and account number', () => {
    const items = [
      mk('Gas', 'Utility - Gas', 'British Gas'),
      mk('Netflix', 'Subscription', 'Netflix Inc', '9988'),
    ];
    expect(searchAndSortOutgoings(items, 'aviva').length).toBe(0);
    expect(searchAndSortOutgoings(items, 'british').map((i) => i.account.name)).toEqual(['Gas']);
    expect(searchAndSortOutgoings(items, 'utility').map((i) => i.account.name)).toEqual(['Gas']);
    expect(searchAndSortOutgoings(items, '9988').map((i) => i.account.name)).toEqual(['Netflix']);
  });
});

describe('computeOutgoingsStats — predicted totals', () => {
  const mkCost = (id: number, extra: Record<string, unknown>): never =>
    ({ account: { id, name: `A${id}`, ...extra }, accountType: 'Utility - Gas' } as never);

  it('keeps existing totals on fixed costs and adds predictions', () => {
    const items = [
      mkCost(1, { monthlyCost: '100', renewalType: 'Monthly' }),
      mkCost(2, { monthlyCost: '60', renewalType: 'Quarterly', costingMethod: 'Provision' }),
    ];
    const stats = computeOutgoingsStats(items, { 2: '90' });
    // Existing totals always use the entered cost
    expect(stats.totalAnnualGbp).toBe(1200 + 240);
    // Prediction swaps in the projection for the Provision item
    expect(stats.predictedAnnualGbp).toBe(1200 + 360);
    expect(stats.predictedMonthlyGbp).toBeCloseTo((1200 + 360) / 12);
  });

  it('predictions equal totals when there are no provisions or end dates', () => {
    const items = [mkCost(1, { monthlyCost: '10', renewalType: 'Monthly' })];
    const stats = computeOutgoingsStats(items);
    expect(stats.predictedAnnualGbp).toBe(stats.totalAnnualGbp);
  });
});
