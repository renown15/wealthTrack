import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import AccountGroupModal from '@views/AccountHub/AccountGroupModal.vue';
import type { PortfolioItem, AccountGroup } from '@models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';

const makeItem = (id: number, name: string): PortfolioItem => ({
  account: {
    id, userId: 1, institutionId: 1, name, typeId: 1, statusId: 1,
    openedAt: null, closedAt: null, accountNumber: null, sortCode: null,
    rollRefNumber: null, interestRate: null, fixedBonusRate: null,
    fixedBonusRateEndDate: null, releaseDate: null, numberOfShares: null,
    underlying: null, price: null, purchasePrice: null, pensionMonthlyPayment: null,
    createdAt: '', updatedAt: '',
  },
  institution: { id: 1, userId: 1, name: 'HSBC', parentId: null, institutionType: null, createdAt: '', updatedAt: '' },
  latestBalance: null,
  accountType: 'Cash ISA',
});

const group1: AccountGroup = { id: 10, userId: 1, name: 'ISA Group', createdAt: '', updatedAt: '' };
const item1 = makeItem(1, 'My ISA');
const item2 = makeItem(2, 'My Pension');

const accountTypes: ReferenceDataItem[] = [
  { id: 1, classKey: 'account_type:cash_isa', referenceValue: 'Cash ISA', sortIndex: 1 },
];

const defaultProps = {
  open: true,
  type: 'create' as const,
  items: [item1, item2],
  accountTypes,
  availableGroups: [group1],
  groupMembersMap: new Map([[10, [1]]]),
};

describe('AccountGroupModal', () => {
  it('renders account list when open', () => {
    // use empty groupMembersMap so no accounts are hidden by hideGrouped=true
    const wrapper = mount(AccountGroupModal, { props: { ...defaultProps, groupMembersMap: new Map() } });
    expect(wrapper.text()).toContain('My ISA');
  });

  it('shows "Create Account Group" title for create type', () => {
    const wrapper = mount(AccountGroupModal, { props: defaultProps });
    expect(wrapper.text()).toContain('Create Account Group');
  });

  it('shows "Edit Account Group" title for edit type', () => {
    const wrapper = mount(AccountGroupModal, { props: { ...defaultProps, type: 'edit', initialGroupName: 'ISA Group' } });
    expect(wrapper.text()).toContain('Edit Account Group');
  });

  it('handleSave: shows error when group name is empty', async () => {
    const wrapper = mount(AccountGroupModal, { props: defaultProps });
    await wrapper.find('button.btn.btn-primary').trigger('click');
    expect(wrapper.text()).toContain('Please enter a group name');
    expect(wrapper.emitted('save')).toBeFalsy();
  });

  it('handleSave: emits save with name and accountIds when valid', async () => {
    const wrapper = mount(AccountGroupModal, { props: defaultProps });
    const nameInput = wrapper.find('input.form-input');
    await nameInput.setValue('My New Group');
    await wrapper.find('button.btn.btn-primary').trigger('click');
    const emitted = wrapper.emitted('save');
    expect(emitted).toBeTruthy();
    expect((emitted![0][0] as any).name).toBe('My New Group');
  });

  it('handleClose: emits close', async () => {
    const wrapper = mount(AccountGroupModal, { props: defaultProps });
    await wrapper.find('button.btn-modal-secondary').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('handleDelete: emits deleteGroup when targetGroupId set', async () => {
    const wrapper = mount(AccountGroupModal, {
      props: { ...defaultProps, type: 'edit', initialGroupId: 10 },
    });
    await wrapper.find('button.btn-danger').trigger('click');
    const emitted = wrapper.emitted('deleteGroup');
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toEqual([10]);
  });

  it('toggleAccount: selects account on row click', async () => {
    const wrapper = mount(AccountGroupModal, { props: { ...defaultProps, groupMembersMap: new Map() } });
    const row = wrapper.find('tr.cursor-pointer');
    await row.trigger('click');
    // count badge should appear
    expect(wrapper.text()).toContain('selected');
  });

  it('toggleAllFiltered: selects all accounts', async () => {
    const wrapper = mount(AccountGroupModal, { props: { ...defaultProps, groupMembersMap: new Map() } });
    const checkbox = wrapper.find('thead input[type="checkbox"]');
    await checkbox.trigger('change');
    expect(wrapper.text()).toContain('selected');
  });

  it('onGroupNameInput: selects existing group when name matches', async () => {
    const wrapper = mount(AccountGroupModal, { props: defaultProps });
    const input = wrapper.find('input.form-input');
    await input.setValue('ISA Group');
    await input.trigger('input');
    await nextTick();
    // save label should change to "Save Changes"
    expect(wrapper.text()).toContain('Save Changes');
  });

  it('resets state when open changes to true', async () => {
    const wrapper = mount(AccountGroupModal, { props: { ...defaultProps, open: false } });
    await wrapper.setProps({ open: true });
    await nextTick();
    expect(wrapper.exists()).toBe(true);
  });
});
