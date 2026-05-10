import { computed } from 'vue';
import type { ComputedRef } from 'vue';
import type { AccountGroup } from '@/models/WealthTrackDataModels';

export function usePortfolioGroups(
  getGroups: () => AccountGroup[],
  getGroupMembers: () => Map<number, number[]>,
): {
  portfolioGroups: ComputedRef<AccountGroup[]>;
  portfolioGroupMembers: ComputedRef<Map<number, number[]>>;
} {
  const portfolioGroups = computed(() =>
    getGroups().filter(g => !g.name.startsWith('Tax Period:'))
  );
  const portfolioGroupMembers = computed(() => {
    const taxIds = new Set(getGroups().filter(g => g.name.startsWith('Tax Period:')).map(g => g.id));
    const result = new Map<number, number[]>();
    getGroupMembers().forEach((v, k) => { if (!taxIds.has(k)) result.set(k, v); });
    return result;
  });
  return { portfolioGroups, portfolioGroupMembers };
}
