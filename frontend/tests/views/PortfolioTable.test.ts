import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PortfolioTable from '@views/AccountHub/PortfolioTable.vue';
import type { PortfolioItem, AccountGroup } from '@models/WealthTrackDataModels';

const mockAccount = (id: number, name: string, institutionId = 1) => ({
  id, userId: 1, institutionId, name, typeId: 1, statusId: 1,
  openedAt: null, closedAt: null, accountNumber: null, sortCode: null,
  rollRefNumber: null, interestRate: '2.5', fixedBonusRate: null,
  fixedBonusRateEndDate: null, releaseDate: null, numberOfShares: null,
  underlying: null, price: null, purchasePrice: null, pensionMonthlyPayment: null,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
});

const mockInstitution = (id: number, name: string) => ({
  id, userId: 1, name, parentId: null, institutionType: null,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
});

const mockBalance = (id: number, accountId: number, value: string) => ({
  id, accountId, userId: 1, eventType: 'balance', value,
  createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z',
});

const item1: PortfolioItem = {
  account: mockAccount(1, 'ISA Account'),
  institution: mockInstitution(1, 'Nationwide'),
  latestBalance: mockBalance(1, 1, '5000'),
  accountType: 'Cash ISA',
  eventCount: 3,
};

const item2: PortfolioItem = {
  account: mockAccount(2, 'Pension'),
  institution: mockInstitution(1, 'Nationwide'),
  latestBalance: mockBalance(2, 2, '20000'),
  accountType: 'Pension',
  eventCount: 1,
};

const group1: AccountGroup = {
  id: 10, userId: 1, name: 'ISA Group',
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
};

const defaultProps = {
  items: [item1, item2],
  groups: [],
  groupMembers: new Map<number, number[]>(),
  accountTypes: [{ id: 1, name: 'Cash ISA', value: 'cash_isa' }],
  grouped: false,
};

describe('PortfolioTable', () => {
  it('renders ungrouped account rows', () => {
    const wrapper = mount(PortfolioTable, { props: defaultProps });
    expect(wrapper.text()).toContain('ISA Account');
    expect(wrapper.text()).toContain('Pension');
    expect(wrapper.text()).toContain('Nationwide');
  });

  it('shows column headers', () => {
    const wrapper = mount(PortfolioTable, { props: defaultProps });
    expect(wrapper.text()).toContain('Account Name');
    expect(wrapper.text()).toContain('Latest Balance');
    expect(wrapper.text()).toContain('Interest Rate');
  });

  it('sortIcon returns ↕ for unsorted column', () => {
    const wrapper = mount(PortfolioTable, { props: defaultProps });
    const icons = wrapper.findAll('.sort-icon');
    expect(icons[0].text()).toBe('↕');
  });

  it('clicking sort header changes sort icon to ↑ then ↓', async () => {
    const wrapper = mount(PortfolioTable, { props: defaultProps });
    const nameHeader = wrapper.find('th.sort-header:nth-child(3)');
    await nameHeader.trigger('click');
    const icon = nameHeader.find('.sort-icon');
    expect(icon.text()).toBe('↑');
    await nameHeader.trigger('click');
    expect(icon.text()).toBe('↓');
  });

  it('renders grouped rows when grouped=true and groupMembers set', async () => {
    // Two items with different names → namesMatch=false → group name shown
    const item3: PortfolioItem = {
      account: mockAccount(3, 'Pension Account', 2),
      institution: mockInstitution(2, 'Barclays'),
      latestBalance: mockBalance(3, 3, '8000'),
      accountType: 'Pension', eventCount: 0,
    };
    const groupMembers = new Map([[10, [1, 3]]]);
    const wrapper = mount(PortfolioTable, {
      props: {
        ...defaultProps,
        grouped: true,
        groups: [group1],
        groupMembers,
        items: [item1, item3],
      },
    });
    expect(wrapper.text()).toContain('ISA Group');
  });

  it('toggleGroup expands group members on click', async () => {
    const groupMembers = new Map([[10, [1]]]);
    const wrapper = mount(PortfolioTable, {
      props: {
        ...defaultProps,
        grouped: true,
        groups: [group1],
        groupMembers,
        items: [item1],
      },
    });
    const groupRow = wrapper.find('tr.group-row');
    await groupRow.trigger('click');
    // member row should now be visible (v-show changes display)
    const memberRows = wrapper.findAll('tr.bg-gray-100');
    expect(memberRows.length).toBeGreaterThan(0);
  });

  it('saveBalance emits updateBalance event with valid value', async () => {
    const wrapper = mount(PortfolioTable, { props: defaultProps });
    // find balance button for item1 and click to start editing
    const balanceBtn = wrapper.find('button.group');
    await balanceBtn.trigger('click');
    // type value in input
    const input = wrapper.find('input.balance-input');
    await input.setValue('6000');
    await input.trigger('keydown.enter');
    const emitted = wrapper.emitted('updateBalance');
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toEqual([1, '6000']);
  });
});
