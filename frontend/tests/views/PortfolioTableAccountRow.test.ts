import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PortfolioTableAccountRow from '@views/AccountHub/PortfolioTableAccountRow.vue';
import type { PortfolioItem } from '@/models/WealthTrackDataModels';

const mockItem: PortfolioItem = {
  account: {
    id: 1,
    userId: 1,
    institutionId: 1,
    name: 'Checking Account',
    typeId: 1,
    statusId: 1,
    openedAt: null,
    closedAt: null,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  institution: { id: 1, userId: 1, name: 'Chase Bank', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  latestBalance: {
    id: 1,
    accountId: 1,
    userId: 1,
    eventType: 'balance',
    value: '1500.00',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
  accountType: 'Checking',
  eventCount: 3,
  docCount: 1,
};

const defaultProps = {
  item: mockItem,
  editingBalanceId: null as number | null,
  editingBalanceValue: '',
};

describe('PortfolioTableAccountRow', () => {
  it('renders institution name', () => {
    const wrapper = mount(PortfolioTableAccountRow, { props: defaultProps });
    expect(wrapper.text()).toContain('Chase Bank');
  });

  it('renders account name', () => {
    const wrapper = mount(PortfolioTableAccountRow, { props: defaultProps });
    expect(wrapper.text()).toContain('Checking Account');
  });

  it('renders account type', () => {
    const wrapper = mount(PortfolioTableAccountRow, { props: defaultProps });
    expect(wrapper.text()).toContain('Checking');
  });

  it('renders event count', () => {
    const wrapper = mount(PortfolioTableAccountRow, { props: defaultProps });
    expect(wrapper.find('.btn-events').text()).toBe('3');
  });

  it('shows edit and delete buttons when not readOnly', () => {
    const wrapper = mount(PortfolioTableAccountRow, { props: defaultProps });
    expect(wrapper.find('.btn-icon.edit').exists()).toBe(true);
    expect(wrapper.find('.btn-icon.delete').exists()).toBe(true);
  });

  it('hides action buttons when readOnly', () => {
    const wrapper = mount(PortfolioTableAccountRow, { props: { ...defaultProps, readOnly: true } });
    expect(wrapper.find('.btn-icon.edit').exists()).toBe(false);
    expect(wrapper.find('.btn-icon.delete').exists()).toBe(false);
  });

  it('shows balance edit input when editingBalanceId matches account id', () => {
    const wrapper = mount(PortfolioTableAccountRow, {
      props: { ...defaultProps, editingBalanceId: 1, editingBalanceValue: '1500' },
    });
    expect(wrapper.find('.balance-input').exists()).toBe(true);
  });

  it('does not show balance input when editingBalanceId does not match', () => {
    const wrapper = mount(PortfolioTableAccountRow, {
      props: { ...defaultProps, editingBalanceId: 99 },
    });
    expect(wrapper.find('.balance-input').exists()).toBe(false);
  });

  it('emits showEvents when events button clicked', async () => {
    const wrapper = mount(PortfolioTableAccountRow, { props: defaultProps });
    await wrapper.find('.btn-events').trigger('click');
    expect(wrapper.emitted('showEvents')?.[0]).toEqual([mockItem]);
  });

  it('emits editAccount when edit button clicked', async () => {
    const wrapper = mount(PortfolioTableAccountRow, { props: defaultProps });
    await wrapper.find('.btn-icon.edit').trigger('click');
    expect(wrapper.emitted('editAccount')?.[0]).toEqual([mockItem.account]);
  });

  it('emits deleteAccount when delete button clicked', async () => {
    const wrapper = mount(PortfolioTableAccountRow, { props: defaultProps });
    await wrapper.find('.btn-icon.delete').trigger('click');
    expect(wrapper.emitted('deleteAccount')?.[0]).toEqual([mockItem.account]);
  });

  it('shows Unassigned when institution is null', () => {
    const item = { ...mockItem, institution: null };
    const wrapper = mount(PortfolioTableAccountRow, { props: { ...defaultProps, item } });
    expect(wrapper.text()).toContain('Unassigned');
  });
});
