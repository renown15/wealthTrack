import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import OutgoingsHubStats from '@/views/OutgoingsHub/OutgoingsHubStats.vue';
import type { OutgoingsStats } from '@composables/useOutgoings';

const defaultStats: OutgoingsStats = {
  totalMonthlyGbp: 0,
  totalAnnualGbp: 0,
  renewingSoonCount: 0,
  byCategory: [],
};

describe('OutgoingsHubStats', () => {
  it('renders title, subtitle and add button', () => {
    const wrapper = mount(OutgoingsHubStats, {
      props: { stats: defaultStats, totalCount: 0 },
    });
    expect(wrapper.text()).toContain('Outgoings Hub');
    expect(wrapper.text()).toContain('Track utilities');
    expect(wrapper.find('button').text()).toContain('Add Outgoing');
  });

  it('renders monthly and annual cost', () => {
    const wrapper = mount(OutgoingsHubStats, {
      props: { stats: { ...defaultStats, totalMonthlyGbp: 150, totalAnnualGbp: 1800 }, totalCount: 5 },
    });
    expect(wrapper.text()).toContain('£150.00');
    expect(wrapper.text()).toContain('£1,800.00');
    expect(wrapper.text()).toContain('5');
  });

  it('applies red-card when renewing soon', () => {
    const wrapper = mount(OutgoingsHubStats, {
      props: { stats: { ...defaultStats, renewingSoonCount: 2 }, totalCount: 3 },
    });
    expect(wrapper.find('.red-card').exists()).toBe(true);
  });

  it('does not apply red-card when nothing renewing soon', () => {
    const wrapper = mount(OutgoingsHubStats, {
      props: { stats: defaultStats, totalCount: 0 },
    });
    expect(wrapper.find('.red-card').exists()).toBe(false);
  });

  it('emits addAccount when button clicked', async () => {
    const wrapper = mount(OutgoingsHubStats, {
      props: { stats: defaultStats, totalCount: 0 },
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('addAccount')).toBeTruthy();
  });
});
