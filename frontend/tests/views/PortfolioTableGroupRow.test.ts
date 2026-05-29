import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PortfolioTableGroupRow from '@views/AccountHub/PortfolioTableGroupRow.vue';
import type { PortfolioItem } from '@/models/WealthTrackDataModels';

vi.mock('@views/AccountHub/PortfolioTableMemberRow.vue', () => ({
  default: {
    name: 'PortfolioTableMemberRow',
    template: '<tr class="mock-member-row"><td>member</td></tr>',
    props: ['item', 'isFirst', 'editingBalanceId', 'editingBalanceValue', 'readOnly'],
    emits: ['saveBalance', 'cancelEdit', 'startEdit', 'update:editingBalanceValue', 'showEvents', 'showDocs', 'editAccount', 'deleteAccount'],
  },
}));

const mockItem: PortfolioItem = {
  account: {
    id: 1,
    userId: 1,
    institutionId: 1,
    name: 'Checking',
    typeId: 1,
    statusId: 1,
    openedAt: null,
    closedAt: null,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  institution: { id: 1, userId: 1, name: 'Chase Bank', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  latestBalance: null,
};

const mockSummary = {
  totalBalance: 5000,
  commonInstitution: 'Chase Bank',
  commonAccountType: 'Checking',
  commonInterestRate: '2.5' as string | number | null | undefined,
  commonBonusRate: null as string | number | null | undefined,
  commonEndDate: null as string | null | undefined,
  commonBalanceUpdatedAt: undefined as string | undefined,
  totalEvents: 3,
  namesMatch: false,
};

const defaultProps = {
  groupId: 1,
  name: 'My Savings Group',
  items: [mockItem],
  summary: mockSummary,
  isExpanded: false,
  editingBalanceId: null as number | null,
  editingBalanceValue: '',
};

describe('PortfolioTableGroupRow', () => {
  it('renders group name', () => {
    const wrapper = mount(PortfolioTableGroupRow, { props: defaultProps });
    expect(wrapper.text()).toContain('My Savings Group');
  });

  it('renders total balance', () => {
    const wrapper = mount(PortfolioTableGroupRow, { props: defaultProps });
    expect(wrapper.text()).toContain('£5,000.00');
  });

  it('renders item count badge', () => {
    const wrapper = mount(PortfolioTableGroupRow, { props: defaultProps });
    expect(wrapper.text()).toContain('1');
  });

  it('renders common institution', () => {
    const wrapper = mount(PortfolioTableGroupRow, { props: defaultProps });
    expect(wrapper.text()).toContain('Chase Bank');
  });

  it('emits toggleGroup when group row clicked', async () => {
    const wrapper = mount(PortfolioTableGroupRow, { props: defaultProps });
    await wrapper.find('.group-row').trigger('click');
    expect(wrapper.emitted('toggleGroup')?.[0]).toEqual([1]);
  });

  it('emits editGroup with id and name when edit button clicked', async () => {
    const wrapper = mount(PortfolioTableGroupRow, { props: defaultProps });
    await wrapper.find('.btn-icon.edit').trigger('click');
    expect(wrapper.emitted('editGroup')?.[0]).toEqual([1, 'My Savings Group']);
  });

  it('emits deleteGroup with id when delete button clicked', async () => {
    const wrapper = mount(PortfolioTableGroupRow, { props: defaultProps });
    await wrapper.find('.btn-icon.delete').trigger('click');
    expect(wrapper.emitted('deleteGroup')?.[0]).toEqual([1]);
  });

  it('hides edit and delete buttons when readOnly', () => {
    const wrapper = mount(PortfolioTableGroupRow, {
      props: { ...defaultProps, readOnly: true },
    });
    expect(wrapper.find('.btn-icon.edit').exists()).toBe(false);
    expect(wrapper.find('.btn-icon.delete').exists()).toBe(false);
  });

  it('renders member rows (hidden by default when collapsed)', () => {
    const wrapper = mount(PortfolioTableGroupRow, { props: defaultProps });
    expect(wrapper.findAll('.mock-member-row').length).toBe(1);
  });

  it('shows event count when totalEvents > 0', () => {
    const wrapper = mount(PortfolioTableGroupRow, { props: defaultProps });
    expect(wrapper.text()).toContain('3');
  });
});
