import { computed, type ComputedRef } from 'vue';
import type { ScenarioAccountItem, ScenarioDetail, ScenarioGroup } from '@models/scenario';

export interface ChartEntry {
  label: string;
  value: number;
}

export type ChartBreakdown = Record<string, { label: string; value: number }[]>;

export interface ScenarioCharts {
  unassignedBalance: ComputedRef<number>;
  groupChartEntries: ComputedRef<ChartEntry[]>;
  groupBreakdown: ComputedRef<ChartBreakdown>;
  memberChartEntries: ComputedRef<ChartEntry[]>;
  memberBreakdown: ComputedRef<ChartBreakdown>;
}

/**
 * Derives pie-chart entries and drill-down breakdowns for a scenario.
 * `detail` and `balanceMap` are getters so the computeds stay reactive to props.
 */
export function useScenarioCharts(
  detail: () => ScenarioDetail,
  balanceMap: () => Record<number, number>,
): ScenarioCharts {
  const bal = (id: number): number => balanceMap()[id] ?? 0;

  const memberLabel = (a: ScenarioAccountItem): string =>
    a.ownerName ? `${a.ownerName} (${a.ownerInitials})` : a.ownerInitials;

  const accountsBalance = (accounts: ScenarioAccountItem[]): number =>
    accounts.reduce((sum, a) => sum + bal(a.accountId), 0);

  const groupBalance = (group: ScenarioGroup): number => accountsBalance(group.accounts);

  function buildBreakdown(
    pairs: { key: string; label: string; value: number }[],
  ): ChartBreakdown {
    const result: ChartBreakdown = {};
    for (const { key, label, value } of pairs) {
      if (!result[key]) result[key] = [];
      const existing = result[key].find((e) => e.label === label);
      if (existing) existing.value += value;
      else result[key].push({ label, value });
    }
    return result;
  }

  const unassignedBalance = computed(() => accountsBalance(detail().unassigned));

  const groupChartEntries = computed(() => {
    const entries = detail().groups.map((g) => ({ label: g.name, value: groupBalance(g) }));
    if (unassignedBalance.value > 0) {
      entries.push({ label: 'Unassigned', value: unassignedBalance.value });
    }
    return entries.filter((e) => e.value > 0);
  });

  const groupBreakdown = computed(() =>
    buildBreakdown([
      ...detail().groups.flatMap((g) =>
        g.accounts.map((a) => ({ key: g.name, label: memberLabel(a), value: bal(a.accountId) })),
      ),
      ...detail().unassigned.map((a) => ({
        key: 'Unassigned',
        label: memberLabel(a),
        value: bal(a.accountId),
      })),
    ]),
  );

  const memberChartEntries = computed(() => {
    const map = new Map<string, number>();
    const all = [...detail().unassigned, ...detail().groups.flatMap((g) => g.accounts)];
    for (const a of all) map.set(memberLabel(a), (map.get(memberLabel(a)) ?? 0) + bal(a.accountId));
    return [...map.entries()].filter(([, v]) => v > 0).map(([label, value]) => ({ label, value }));
  });

  const memberBreakdown = computed(() =>
    buildBreakdown([
      ...detail().groups.flatMap((g) =>
        g.accounts.map((a) => ({ key: memberLabel(a), label: g.name, value: bal(a.accountId) })),
      ),
      ...detail().unassigned.map((a) => ({
        key: memberLabel(a),
        label: 'Unassigned',
        value: bal(a.accountId),
      })),
    ]),
  );

  return {
    unassignedBalance,
    groupChartEntries,
    groupBreakdown,
    memberChartEntries,
    memberBreakdown,
  };
}
