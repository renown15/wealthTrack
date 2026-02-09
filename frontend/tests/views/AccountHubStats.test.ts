import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AccountHubStats from '@/views/AccountHub/AccountHubStats.vue';

describe('AccountHubStats', () => {
  it('renders title and stats', () => {
    const wrapper = mount(AccountHubStats, {
      props: {
        totalValue: 25000,
        accountCount: 3,
      },
    });

    expect(wrapper.text()).toContain('Portfolio Dashboard');
    expect(wrapper.text()).toContain('Total Value');
    expect(wrapper.text()).toContain('$25,000.00');
    expect(wrapper.text()).toContain('Accounts');
    expect(wrapper.text()).toContain('3');
  });

  it('emits createAccount event when + New Account clicked', async () => {
    const wrapper = mount(AccountHubStats, {
      props: {
        totalValue: 0,
        accountCount: 0,
      },
    });

    const buttons = wrapper.findAll('button');
    const createAccountBtn = buttons.find((btn) => btn.text().includes('+ New Account'));
    await createAccountBtn?.trigger('click');

    expect(wrapper.emitted('createAccount')).toBeTruthy();
  });

  it('emits createInstitution event when + New Institution clicked', async () => {
    const wrapper = mount(AccountHubStats, {
      props: {
        totalValue: 0,
        accountCount: 0,
      },
    });

    const buttons = wrapper.findAll('button');
    const createInstBtn = buttons.find((btn) => btn.text().includes('+ New Institution'));
    await createInstBtn?.trigger('click');

    expect(wrapper.emitted('createInstitution')).toBeTruthy();
  });

  it('formats currency correctly', () => {
    const wrapper = mount(AccountHubStats, {
      props: {
        totalValue: 1234.56,
        accountCount: 1,
      },
    });

    expect(wrapper.text()).toContain('$1,234.56');
  });
});
