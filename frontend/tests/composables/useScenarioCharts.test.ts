import { describe, it, expect } from 'vitest';
import { useScenarioCharts } from '@/composables/useScenarioCharts';
import type { ScenarioAccountItem, ScenarioDetail } from '@/models/scenario';

const acct = (
  accountId: number,
  ownerInitials: string,
  ownerName = '',
): ScenarioAccountItem => ({
  accountId,
  name: 'ISA',
  institutionName: 'Barclays',
  accountType: 'Stocks ISA',
  balance: null,
  ownerInitials,
  ownerName,
});

const detail = (): ScenarioDetail => ({
  scenarioId: 1,
  name: 'Plan A',
  ownerUserId: 1,
  isOwner: true,
  groups: [
    { linkId: 10, groupId: 20, name: 'Aggressive', sortOrder: 0, accounts: [acct(1, 'ML', 'Mark'), acct(2, 'JD')] },
    { linkId: 11, groupId: 21, name: 'Safe', sortOrder: 1, accounts: [acct(3, 'ML', 'Mark')] },
  ],
  unassigned: [acct(4, 'JD')],
});

const balanceMap = { 1: 50000, 2: 30000, 3: 20000, 4: 10000 };

describe('useScenarioCharts', () => {
  it('builds group chart entries including a non-zero Unassigned slice', () => {
    const { groupChartEntries, unassignedBalance } = useScenarioCharts(detail, () => balanceMap);
    expect(unassignedBalance.value).toBe(10000);
    expect(groupChartEntries.value).toEqual([
      { label: 'Aggressive', value: 80000 },
      { label: 'Safe', value: 20000 },
      { label: 'Unassigned', value: 10000 },
    ]);
  });

  it('omits zero-value groups and Unassigned when balances are missing', () => {
    const { groupChartEntries, unassignedBalance } = useScenarioCharts(detail, () => ({}));
    expect(unassignedBalance.value).toBe(0);
    expect(groupChartEntries.value).toEqual([]);
  });

  it('aggregates balances by member with owner-name labels', () => {
    const { memberChartEntries } = useScenarioCharts(detail, () => balanceMap);
    expect(memberChartEntries.value).toEqual([
      { label: 'JD', value: 40000 },
      { label: 'Mark (ML)', value: 70000 },
    ]);
  });

  it('produces a group breakdown keyed by group with member sub-totals', () => {
    const { groupBreakdown } = useScenarioCharts(detail, () => balanceMap);
    expect(groupBreakdown.value.Aggressive).toEqual([
      { label: 'Mark (ML)', value: 50000 },
      { label: 'JD', value: 30000 },
    ]);
    expect(groupBreakdown.value.Unassigned).toEqual([{ label: 'JD', value: 10000 }]);
  });

  it('produces a member breakdown keyed by member with group sub-totals', () => {
    const { memberBreakdown } = useScenarioCharts(detail, () => balanceMap);
    expect(memberBreakdown.value['Mark (ML)']).toEqual([
      { label: 'Aggressive', value: 50000 },
      { label: 'Safe', value: 20000 },
    ]);
    expect(memberBreakdown.value.JD).toEqual([
      { label: 'Aggressive', value: 30000 },
      { label: 'Unassigned', value: 10000 },
    ]);
  });
});
