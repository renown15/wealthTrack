import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ScenarioGroupTable from '@/views/ScenarioHub/ScenarioGroupTable.vue';
import type { ScenarioDetail } from '@/models/scenario';

const makeDetail = (accounts: { accountId: number; ownerInitials: string; ownerName?: string }[]): ScenarioDetail => ({
  scenarioId: 1, name: 'Plan A', ownerUserId: 1, isOwner: true,
  groups: [{
    linkId: 10, groupId: 20, name: 'Aggressive', sortOrder: 0,
    accounts: accounts.map(a => ({
      ...a, name: 'ISA', institutionName: 'Barclays', accountType: 'Stocks ISA', balance: null,
      ownerName: a.ownerName ?? '',
    })),
  }],
  unassigned: [],
});

const balanceMap = { 1: 50000, 2: 30000, 3: 20000 };

describe('ScenarioGroupTable collapsed summary', () => {
  it('shows account count when expanded', async () => {
    const detail = makeDetail([{ accountId: 1, ownerInitials: 'ML' }, { accountId: 2, ownerInitials: 'JD' }]);
    const wrapper = mount(ScenarioGroupTable, { props: { detail, balanceMap } });
    expect(wrapper.text()).toContain('(2)');
  });

  it('shows initials and total balance when collapsed', async () => {
    const detail = makeDetail([{ accountId: 1, ownerInitials: 'ML' }, { accountId: 2, ownerInitials: 'JD' }, { accountId: 3, ownerInitials: 'ML' }]);
    const wrapper = mount(ScenarioGroupTable, { props: { detail, balanceMap } });
    await wrapper.find('button').trigger('click'); // collapse
    const text = wrapper.text();
    expect(text).toContain('ML×2');
    expect(text).toContain('JD×1');
    expect(text).toContain('£100,000.00');
  });

  it('hides initials and balance when re-expanded', async () => {
    const detail = makeDetail([{ accountId: 1, ownerInitials: 'ML' }]);
    const wrapper = mount(ScenarioGroupTable, { props: { detail, balanceMap } });
    await wrapper.find('button').trigger('click'); // collapse
    await wrapper.find('button').trigger('click'); // expand
    expect(wrapper.text()).toContain('(1)');
    expect(wrapper.text()).not.toContain('ML×');
  });
});
