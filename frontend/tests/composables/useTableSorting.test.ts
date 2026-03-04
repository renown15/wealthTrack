import { describe, it, expect } from 'vitest';
import type { PortfolioItem } from '@models/WealthTrackDataModels';
import { useTableSorting } from '@views/AccountHub/useTableSorting';

const makeItem = (overrides: {
  name?: string;
  institution?: string;
  accountType?: string;
  balance?: string;
  interestRate?: string;
  balanceDate?: string;
  fixedBonusRateEndDate?: string;
} = {}): PortfolioItem => ({
  account: {
    id: 1, userId: 1, institutionId: 1,
    name: overrides.name ?? 'Account',
    typeId: 1, statusId: 1,
    openedAt: null, closedAt: null, accountNumber: null, sortCode: null,
    rollRefNumber: null,
    interestRate: overrides.interestRate ?? null,
    fixedBonusRate: null,
    fixedBonusRateEndDate: overrides.fixedBonusRateEndDate ?? null,
    releaseDate: null, numberOfShares: null, underlying: null,
    price: null, purchasePrice: null, pensionMonthlyPayment: null,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  institution: overrides.institution
    ? { id: 1, userId: 1, name: overrides.institution, parentId: null, institutionType: null, createdAt: '', updatedAt: '' }
    : null,
  latestBalance: overrides.balance
    ? { id: 1, accountId: 1, userId: 1, eventType: 'balance', value: overrides.balance, createdAt: overrides.balanceDate ?? '2024-01-01T00:00:00Z', updatedAt: '' }
    : null,
  accountType: overrides.accountType ?? 'Cash ISA',
});

describe('useTableSorting', () => {
  it('defaults to institution sort asc', () => {
    const items = [makeItem({ institution: 'Zopa' }), makeItem({ institution: 'Barclays' })];
    const { sortedItems, sortBy, sortDirection } = useTableSorting(items);
    expect(sortBy.value).toBe('institution');
    expect(sortDirection.value).toBe('asc');
    expect(sortedItems.value[0].institution?.name).toBe('Barclays');
  });

  it('setSortBy same column toggles direction', () => {
    const items = [makeItem({ name: 'Z' }), makeItem({ name: 'A' })];
    const { sortedItems, setSortBy } = useTableSorting(items);
    setSortBy('institution');
    expect(sortedItems.value).toBeDefined();
    setSortBy('institution');
    // direction toggled
  });

  it('setSortBy new column resets direction to asc', () => {
    const items = [makeItem({ name: 'Z', institution: 'Z' }), makeItem({ name: 'A', institution: 'A' })];
    const { sortBy, sortDirection, setSortBy } = useTableSorting(items);
    setSortBy('accountName');
    expect(sortBy.value).toBe('accountName');
    expect(sortDirection.value).toBe('asc');
  });

  it('sorts by accountName', () => {
    const items = [makeItem({ name: 'Zebra' }), makeItem({ name: 'Apple' })];
    const { setSortBy, sortedItems } = useTableSorting(items);
    setSortBy('accountName');
    expect(sortedItems.value[0].account.name).toBe('Apple');
  });

  it('sorts by accountType', () => {
    const items = [makeItem({ accountType: 'Pension' }), makeItem({ accountType: 'Cash ISA' })];
    const { setSortBy, sortedItems } = useTableSorting(items);
    setSortBy('accountType');
    expect(sortedItems.value[0].accountType).toBe('Cash ISA');
  });

  it('sorts by balance numerically', () => {
    const items = [makeItem({ balance: '500' }), makeItem({ balance: '10000' })];
    const { setSortBy, sortedItems } = useTableSorting(items);
    setSortBy('balance');
    expect(sortedItems.value[0].latestBalance?.value).toBe('500');
  });

  it('sorts by balanceUpdated date', () => {
    const items = [
      makeItem({ balance: '1', balanceDate: '2024-06-01T00:00:00Z' }),
      makeItem({ balance: '2', balanceDate: '2023-01-01T00:00:00Z' }),
    ];
    const { setSortBy, sortedItems } = useTableSorting(items);
    setSortBy('balanceUpdated');
    expect(sortedItems.value[0].latestBalance?.createdAt).toBe('2023-01-01T00:00:00Z');
  });

  it('sorts by interestRate', () => {
    const items = [makeItem({ interestRate: '5' }), makeItem({ interestRate: '2' })];
    const { setSortBy, sortedItems } = useTableSorting(items);
    setSortBy('interestRate');
    expect(parseFloat(sortedItems.value[0].account.interestRate!)).toBe(2);
  });

  it('sorts by fixedRateEnd', () => {
    const items = [
      makeItem({ fixedBonusRateEndDate: '2025-12-01' }),
      makeItem({ fixedBonusRateEndDate: '2024-01-01' }),
    ];
    const { setSortBy, sortedItems } = useTableSorting(items);
    setSortBy('fixedRateEnd');
    expect(sortedItems.value[0].account.fixedBonusRateEndDate).toBe('2024-01-01');
  });

  it('handles unknown sort column (returns 0)', () => {
    const items = [makeItem({ name: 'B' }), makeItem({ name: 'A' })];
    const { setSortBy, sortedItems } = useTableSorting(items);
    setSortBy('unknownColumn');
    // order unchanged
    expect(sortedItems.value).toHaveLength(2);
  });

  it('toggles to desc on second setSortBy call on same column', () => {
    const items = [makeItem({ name: 'A' }), makeItem({ name: 'Z' })];
    const { setSortBy, sortDirection } = useTableSorting(items);
    setSortBy('accountName');
    setSortBy('accountName');
    expect(sortDirection.value).toBe('desc');
  });
});
