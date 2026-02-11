import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AccountHubStats from '@/views/AccountHub/AccountHubStats.vue';

describe('AccountHubStats', () => {
  it('renders header content and stats', () => {
    const wrapper = mount(AccountHubStats, {
      props: {
        totalValue: 25000,
        accountCount: 3,
        institutionCount: 2,
        eventCount: 5,
      },
    });

    expect(wrapper.text()).toContain('Account Hub');
    expect(wrapper.text()).toContain('Snapshot of your portfolio');
    expect(wrapper.text()).toContain('ADD ACCOUNT');
    expect(wrapper.text()).toContain('ADD INSTITUTION');
    expect(wrapper.text()).toContain('Total Value');
    expect(wrapper.text()).toContain('£25,000.00');
    expect(wrapper.text()).toContain('Accounts');
    expect(wrapper.text()).toContain('3');
    expect(wrapper.text()).toContain('Institutions');
    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain('Events');
    expect(wrapper.text()).toContain('5');
  });

  it('emits createAccount event when header button clicked', async () => {
    const wrapper = mount(AccountHubStats, {
      props: {
        totalValue: 0,
        accountCount: 0,
        institutionCount: 0,
        eventCount: 0,
      },
    });

    const createAccountBtn = wrapper.find('button.btn-primary');
    await createAccountBtn.trigger('click');

    expect(wrapper.emitted('createAccount')).toBeTruthy();
  });

  it('emits createInstitution event when secondary button clicked', async () => {
    const wrapper = mount(AccountHubStats, {
      props: {
        totalValue: 0,
        accountCount: 0,
        institutionCount: 0,
        eventCount: 0,
      },
    });

    const createInstBtn = wrapper.find('button.btn-secondary');
    await createInstBtn.trigger('click');

    expect(wrapper.emitted('createInstitution')).toBeTruthy();
  });

  it('formats currency correctly', () => {
    const wrapper = mount(AccountHubStats, {
      props: {
        totalValue: 1234.56,
        accountCount: 1,
        institutionCount: 0,
        eventCount: 0,
      },
    });

    expect(wrapper.text()).toContain('£1,234.56');
  });
});
