import { describe, it, expect } from 'vitest';
import { usePortfolioGroups } from '@/composables/usePortfolioGroups';
import type { AccountGroup } from '@/models/WealthTrackDataModels';

const makeGroup = (id: number, name: string): AccountGroup => ({
  id, userId: 1, name, createdAt: '2025-01-01', updatedAt: '2025-01-01',
});

const regularGroups = [
  makeGroup(1, 'Deferred Cash'),
  makeGroup(2, 'Deferred Shares'),
  makeGroup(3, 'Nominee (Vested Shares)'),
];

const taxPeriodGroups = [
  makeGroup(4, 'Tax Period: 2026/27'),
  makeGroup(5, 'Tax Period: 2025/26'),
];

const allGroups = [...regularGroups, ...taxPeriodGroups];

const allMembers = new Map<number, number[]>([
  [1, [13, 14, 15]],
  [2, [9, 10, 11]],
  [3, [36, 37, 38, 39]],
  [4, []],
  [5, [31, 48, 49]],
]);

describe('usePortfolioGroups - portfolioGroups', () => {
  it('filters out Tax Period groups', () => {
    const { portfolioGroups } = usePortfolioGroups(() => allGroups, () => allMembers);
    expect(portfolioGroups.value).toHaveLength(3);
    expect(portfolioGroups.value.map(g => g.name)).toEqual([
      'Deferred Cash', 'Deferred Shares', 'Nominee (Vested Shares)',
    ]);
  });

  it('returns all groups when none are Tax Period groups', () => {
    const { portfolioGroups } = usePortfolioGroups(() => regularGroups, () => new Map());
    expect(portfolioGroups.value).toHaveLength(3);
  });

  it('returns empty when all groups are Tax Period groups', () => {
    const { portfolioGroups } = usePortfolioGroups(() => taxPeriodGroups, () => new Map());
    expect(portfolioGroups.value).toHaveLength(0);
  });

  it('returns empty when there are no groups', () => {
    const { portfolioGroups } = usePortfolioGroups(() => [], () => new Map());
    expect(portfolioGroups.value).toHaveLength(0);
  });
});

describe('usePortfolioGroups - portfolioGroupMembers', () => {
  it('excludes members belonging to Tax Period groups', () => {
    const { portfolioGroupMembers } = usePortfolioGroups(() => allGroups, () => allMembers);
    expect(portfolioGroupMembers.value.has(4)).toBe(false);
    expect(portfolioGroupMembers.value.has(5)).toBe(false);
  });

  it('retains members belonging to regular groups', () => {
    const { portfolioGroupMembers } = usePortfolioGroups(() => allGroups, () => allMembers);
    expect(portfolioGroupMembers.value.get(1)).toEqual([13, 14, 15]);
    expect(portfolioGroupMembers.value.get(2)).toEqual([9, 10, 11]);
    expect(portfolioGroupMembers.value.get(3)).toEqual([36, 37, 38, 39]);
  });

  it('accounts that are only in Tax Period groups are not in the members map', () => {
    const { portfolioGroupMembers } = usePortfolioGroups(() => allGroups, () => allMembers);
    const allMemberIds = new Set([...portfolioGroupMembers.value.values()].flat());
    expect(allMemberIds.has(31)).toBe(false);
    expect(allMemberIds.has(48)).toBe(false);
    expect(allMemberIds.has(49)).toBe(false);
  });

  it('returns empty map when all groups are Tax Period groups', () => {
    const taxOnlyMembers = new Map([[4, []], [5, [31, 48, 49]]]);
    const { portfolioGroupMembers } = usePortfolioGroups(() => taxPeriodGroups, () => taxOnlyMembers);
    expect(portfolioGroupMembers.value.size).toBe(0);
  });
});
