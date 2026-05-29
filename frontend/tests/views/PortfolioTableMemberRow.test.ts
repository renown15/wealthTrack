import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PortfolioTableMemberRow from '@views/AccountHub/PortfolioTableMemberRow.vue';
import type { PortfolioItem } from '@/models/WealthTrackDataModels';

const mockItem: PortfolioItem = {
  account: {
    id: 5,
    userId: 1,
    institutionId: 1,
    name: 'Savings Account',
    typeId: 1,
    statusId: 1,
    openedAt: null,
    closedAt: null,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  institution: { id: 1, userId: 1, name: 'Barclays', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  latestBalance: {
    id: 10,
    accountId: 5,
    userId: 1,
    eventType: 'balance',
    value: '3000.00',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-01',
  },
  accountType: 'Savings',
  eventCount: 5,
  docCount: 0,
};

const defaultProps = {
  item: mockItem,
  isFirst: false,
  editingBalanceId: null as number | null,
  editingBalanceValue: '',
};

describe('PortfolioTableMemberRow', () => {
  it('renders institution name', () => {
    const wrapper = mount(PortfolioTableMemberRow, { props: defaultProps });
    expect(wrapper.text()).toContain('Barclays');
  });

  it('renders account name', () => {
    const wrapper = mount(PortfolioTableMemberRow, { props: defaultProps });
    expect(wrapper.text()).toContain('Savings Account');
  });

  it('renders event count', () => {
    const wrapper = mount(PortfolioTableMemberRow, { props: defaultProps });
    expect(wrapper.find('.btn-events').text()).toBe('5');
  });

  it('shows edit and delete buttons when not readOnly', () => {
    const wrapper = mount(PortfolioTableMemberRow, { props: defaultProps });
    expect(wrapper.find('.btn-icon.edit').exists()).toBe(true);
    expect(wrapper.find('.btn-icon.delete').exists()).toBe(true);
  });

  it('hides action buttons when readOnly', () => {
    const wrapper = mount(PortfolioTableMemberRow, { props: { ...defaultProps, readOnly: true } });
    expect(wrapper.find('.btn-icon.edit').exists()).toBe(false);
    expect(wrapper.find('.btn-icon.delete').exists()).toBe(false);
  });

  it('shows balance edit input when editingBalanceId matches', () => {
    const wrapper = mount(PortfolioTableMemberRow, {
      props: { ...defaultProps, editingBalanceId: 5, editingBalanceValue: '3000' },
    });
    expect(wrapper.find('.balance-input').exists()).toBe(true);
  });

  it('does not show balance input when editingBalanceId does not match', () => {
    const wrapper = mount(PortfolioTableMemberRow, {
      props: { ...defaultProps, editingBalanceId: 99 },
    });
    expect(wrapper.find('.balance-input').exists()).toBe(false);
  });

  it('emits showEvents when events button clicked', async () => {
    const wrapper = mount(PortfolioTableMemberRow, { props: defaultProps });
    await wrapper.find('.btn-events').trigger('click');
    expect(wrapper.emitted('showEvents')?.[0]).toEqual([mockItem]);
  });

  it('emits editAccount when edit button clicked', async () => {
    const wrapper = mount(PortfolioTableMemberRow, { props: defaultProps });
    await wrapper.find('.btn-icon.edit').trigger('click');
    expect(wrapper.emitted('editAccount')?.[0]).toEqual([mockItem.account]);
  });

  it('emits deleteAccount when delete button clicked', async () => {
    const wrapper = mount(PortfolioTableMemberRow, { props: defaultProps });
    await wrapper.find('.btn-icon.delete').trigger('click');
    expect(wrapper.emitted('deleteAccount')?.[0]).toEqual([mockItem.account]);
  });

  it('shows Unassigned when institution is null', () => {
    const item = { ...mockItem, institution: null };
    const wrapper = mount(PortfolioTableMemberRow, { props: { ...defaultProps, item } });
    expect(wrapper.text()).toContain('Unassigned');
  });

  it('applies first-member class when isFirst is true', () => {
    const wrapper = mount(PortfolioTableMemberRow, { props: { ...defaultProps, isFirst: true } });
    expect(wrapper.find('tr').classes()).toContain('first-member');
  });
});
