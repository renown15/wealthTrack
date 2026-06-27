import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TaxHubStats from '@/views/TaxHub/TaxHubStats.vue';
import type { TaxPeriod } from '@/models/TaxModels';

const mockPeriod: TaxPeriod = {
  id: 1,
  userId: 1,
  name: '2024/25',
  startDate: '2024-04-06',
  endDate: '2025-04-05',
  accountGroupId: null,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('TaxHubStats', () => {
  it('renders Tax Hub title', () => {
    const wrapper = mount(TaxHubStats, { props: { periods: [], selectedPeriodId: null } });
    expect(wrapper.text()).toContain('Tax Hub');
  });

  it('renders Add Tax Period button', () => {
    const wrapper = mount(TaxHubStats, { props: { periods: [], selectedPeriodId: null } });
    expect(wrapper.text()).toContain('Add Tax Period');
  });

  it('shows empty state when no periods', () => {
    const wrapper = mount(TaxHubStats, { props: { periods: [], selectedPeriodId: null } });
    expect(wrapper.text()).toContain('No tax periods yet');
  });

  it('renders period name in stat card', () => {
    const wrapper = mount(TaxHubStats, { props: { periods: [mockPeriod], selectedPeriodId: null } });
    expect(wrapper.text()).toContain('2024/25');
  });

  it('does not show empty state when periods exist', () => {
    const wrapper = mount(TaxHubStats, { props: { periods: [mockPeriod], selectedPeriodId: null } });
    expect(wrapper.text()).not.toContain('No tax periods yet');
  });

  it('emits addPeriod when button clicked', async () => {
    const wrapper = mount(TaxHubStats, { props: { periods: [], selectedPeriodId: null } });
    await wrapper.find('.btn-primary').trigger('click');
    expect(wrapper.emitted('addPeriod')).toBeTruthy();
  });

  it('emits selectPeriod with period id when card clicked', async () => {
    const wrapper = mount(TaxHubStats, { props: { periods: [mockPeriod], selectedPeriodId: null } });
    await wrapper.find('.stat-card').trigger('click');
    expect(wrapper.emitted('selectPeriod')?.[0]).toEqual([1]);
  });

  it('emits deletePeriod with id and name when REMOVE clicked', async () => {
    const wrapper = mount(TaxHubStats, { props: { periods: [mockPeriod], selectedPeriodId: null } });
    const removeBtn = wrapper.findAll('button').find((b) => b.text() === 'REMOVE');
    await removeBtn?.trigger('click');
    expect(wrapper.emitted('deletePeriod')?.[0]).toEqual([1, '2024/25']);
  });

  it('emits exportBriefing when Export Briefing Pack clicked', async () => {
    const wrapper = mount(TaxHubStats, { props: { periods: [mockPeriod], selectedPeriodId: null } });
    const btn = wrapper.findAll('button').find((b) => b.text() === 'Export Briefing Pack');
    await btn?.trigger('click');
    expect(wrapper.emitted('exportBriefing')).toBeTruthy();
  });

  it('shows Add Closed Account only when a period is selected', async () => {
    const none = mount(TaxHubStats, { props: { periods: [mockPeriod], selectedPeriodId: null } });
    expect(none.findAll('button').some((b) => b.text() === '+ Add Closed Account')).toBe(false);
    const selected = mount(TaxHubStats, { props: { periods: [mockPeriod], selectedPeriodId: 1 } });
    const btn = selected.findAll('button').find((b) => b.text() === '+ Add Closed Account');
    expect(btn).toBeTruthy();
    await btn?.trigger('click');
    expect(selected.emitted('openQuickAdd')).toBeTruthy();
  });

  it('applies ring class to the selected period', () => {
    const wrapper = mount(TaxHubStats, { props: { periods: [mockPeriod], selectedPeriodId: 1 } });
    expect(wrapper.find('.ring-2').exists()).toBe(true);
  });

  it('does not apply ring class when period is not selected', () => {
    const wrapper = mount(TaxHubStats, { props: { periods: [mockPeriod], selectedPeriodId: 99 } });
    expect(wrapper.find('.ring-2').exists()).toBe(false);
  });
});
