import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ScenarioGroupRow from '@views/ScenarioHub/ScenarioGroupRow.vue';
import type { ScenarioAccountItem } from '@models/scenario';

const acc: ScenarioAccountItem = {
  accountId: 1,
  name: 'Cash ISA',
  institutionName: 'Barclays',
  accountType: 'Savings Account',
  balance: null,
  ownerInitials: '',
  ownerName: '',
};

function makeWrapper(overrides: Partial<InstanceType<typeof ScenarioGroupRow>['$props']> = {}) {
  return mount(ScenarioGroupRow, {
    props: { account: acc, balanceMap: { 1: 10000 }, isOwner: true, ...overrides },
  });
}

describe('ScenarioGroupRow', () => {
  it('renders account name, institution and type', () => {
    const w = makeWrapper();
    expect(w.text()).toContain('Cash ISA');
    expect(w.text()).toContain('Barclays');
    expect(w.text()).toContain('Savings Account');
  });

  it('formats balance from balanceMap', () => {
    const w = makeWrapper({ balanceMap: { 1: 5000 } });
    expect(w.text()).toContain('£5,000');
  });

  it('shows — when account not in balanceMap', () => {
    const w = makeWrapper({ balanceMap: {} });
    expect(w.text()).toContain('—');
  });

  it('emits dragStart with accountId on dragstart', async () => {
    const w = makeWrapper();
    await w.find('tr').trigger('dragstart');
    expect(w.emitted('dragStart')).toBeTruthy();
    expect(w.emitted('dragStart')![0]).toEqual([1]);
  });

  it('emits unassign when remove button clicked (owner)', async () => {
    const w = makeWrapper({ isOwner: true });
    await w.find('button').trigger('click');
    expect(w.emitted('unassign')).toBeTruthy();
    expect(w.emitted('unassign')![0]).toEqual([1]);
  });

  it('hides remove button for non-owner', () => {
    const w = makeWrapper({ isOwner: false });
    expect(w.find('button').exists()).toBe(false);
  });
});
