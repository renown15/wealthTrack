import { describe, it, expect } from 'vitest';
import { searchAndSortOutgoings } from '@composables/useOutgoings';

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
