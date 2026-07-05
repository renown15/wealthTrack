import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AccountHubStats from '@/views/AccountHub/AccountHubStats.vue';
import InfoBadge from '@views/AccountHub/InfoBadge.vue';
import type { PensionBreakdown } from '@/composables/portfolioCalculations';

const mockPensionBreakdown: PensionBreakdown = {
  total: 0,
  dcTotal: 0,
  dbTotal: 0,
  lifeExpectancy: 36,
  annuityRate: 0.075,
  accounts: [],
};

const defaultProps = {
  totalValue: 0,
  cashAtHand: 0,
  isaSavings: 0,
  illiquid: 0,
  trustAssets: 0,
  totalTax: 0,
  projectedAnnualYield: 0,
  pensionBreakdown: mockPensionBreakdown,
  items: [],
};

describe('AccountHubStats', () => {
  it('renders header content and stats', () => {
    const wrapper = mount(AccountHubStats, {
      props: {
        ...defaultProps,
        totalValue: 25000,
        cashAtHand: 10000,
        isaSavings: 15000,
      },
    });

    expect(wrapper.text()).toContain('Account Hub');
    expect(wrapper.text()).toContain('Snapshot of your portfolio');
    expect(wrapper.text()).toContain('Add Account');
    expect(wrapper.text()).toContain('Add Institution');
    expect(wrapper.text()).toContain('Total Value');
    expect(wrapper.text()).toContain('£25,000.00');
    expect(wrapper.text()).toContain('Cash at Hand');
    expect(wrapper.text()).toContain('ISA Savings');
  });

  it('shows the tax deduction in the Total Value tooltip when tax is owed', () => {
    const wrapper = mount(AccountHubStats, { props: { ...defaultProps, totalTax: 1200 } });
    const totalTooltip = wrapper.findAllComponents(InfoBadge)
      .map((b) => b.props('text') as string)
      .find((t) => t.includes('Cash at Hand'));
    expect(totalTooltip).toContain('Tax owed');
    expect(totalTooltip).toContain('-£1,200.00');
  });

  it('emits createAccount event when header button clicked', async () => {
    const wrapper = mount(AccountHubStats, { props: defaultProps });

    const createAccountBtn = wrapper.find('button.btn-primary');
    await createAccountBtn.trigger('click');

    expect(wrapper.emitted('createAccount')).toBeTruthy();
  });

  it('emits createInstitution event when secondary button clicked', async () => {
    const wrapper = mount(AccountHubStats, { props: defaultProps });

    const createInstBtn = wrapper.find('button.btn-secondary');
    await createInstBtn.trigger('click');

    expect(wrapper.emitted('createInstitution')).toBeTruthy();
  });

  it('formats currency correctly', () => {
    const wrapper = mount(AccountHubStats, {
      props: {
        ...defaultProps,
        totalValue: 1234.56,
      },
    });

    expect(wrapper.text()).toContain('£1,234.56');
  });

  it('shows the Encumbrances + Tax card including unpaid tax', () => {
    const wrapper = mount(AccountHubStats, { props: { ...defaultProps, totalTax: 1200 } });
    expect(wrapper.text()).toContain('Encumbrances + Tax');
    expect(wrapper.text()).toContain('£1,200.00');
  });
});
