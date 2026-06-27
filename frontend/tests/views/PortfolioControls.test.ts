import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PortfolioControls from '@views/AccountHub/PortfolioControls.vue';

describe('PortfolioControls', () => {
  it('renders Portfolio section title', () => {
    const wrapper = mount(PortfolioControls, { props: { hideClosed: false, grouped: false } });
    expect(wrapper.text()).toContain('Portfolio');
  });

  it('renders Hide Closed label', () => {
    const wrapper = mount(PortfolioControls, { props: { hideClosed: false, grouped: false } });
    expect(wrapper.text()).toContain('Hide Closed');
  });

  it('renders Grouped label', () => {
    const wrapper = mount(PortfolioControls, { props: { hideClosed: false, grouped: false } });
    expect(wrapper.text()).toContain('Grouped');
  });

  it('emits toggle-hide-closed when toggle button clicked', async () => {
    const wrapper = mount(PortfolioControls, { props: { hideClosed: false, grouped: false } });
    await wrapper.find('[title="Toggle closed accounts"]').trigger('click');
    expect(wrapper.emitted('toggle-hide-closed')).toBeTruthy();
  });

  it('emits toggle-grouped when grouped toggle button clicked', async () => {
    const wrapper = mount(PortfolioControls, { props: { hideClosed: false, grouped: false } });
    await wrapper.find('[title="Toggle grouping"]').trigger('click');
    expect(wrapper.emitted('toggle-grouped')).toBeTruthy();
  });

  it('shows Refresh Prices button', () => {
    const wrapper = mount(PortfolioControls, { props: { hideClosed: false, grouped: false } });
    expect(wrapper.text()).toContain('Refresh Prices');
  });

  it('disables Refresh Prices and shows Refreshing text when refreshing', () => {
    const wrapper = mount(PortfolioControls, {
      props: { hideClosed: false, grouped: false, refreshing: true },
    });
    const btn = wrapper.find('[title="Clear price cache and fetch latest share prices"]');
    expect(btn.attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('Refreshing…');
  });

  it('emits refresh-prices when Refresh Prices clicked', async () => {
    const wrapper = mount(PortfolioControls, { props: { hideClosed: false, grouped: false } });
    await wrapper.find('[title="Clear price cache and fetch latest share prices"]').trigger('click');
    expect(wrapper.emitted('refresh-prices')).toBeTruthy();
  });

  it('emits export when Excel button clicked', async () => {
    const wrapper = mount(PortfolioControls, { props: { hideClosed: false, grouped: false } });
    await wrapper.find('[title="Export accounts to Excel"]').trigger('click');
    expect(wrapper.emitted('export')).toBeTruthy();
  });

  it('Hide Closed toggle has active style when hideClosed is true', () => {
    const wrapper = mount(PortfolioControls, { props: { hideClosed: true, grouped: false } });
    const toggle = wrapper.find('[title="Toggle closed accounts"]');
    expect(toggle.classes()).toContain('bg-blue-600');
  });

  it('Grouped toggle has active style when grouped is true', () => {
    const wrapper = mount(PortfolioControls, { props: { hideClosed: false, grouped: true } });
    const toggle = wrapper.find('[title="Toggle grouping"]');
    expect(toggle.classes()).toContain('bg-blue-600');
  });

  it('renders the search input with current value', () => {
    const wrapper = mount(PortfolioControls, { props: { hideClosed: false, grouped: false, search: 'barclays' } });
    expect((wrapper.find('input[type="search"]').element as HTMLInputElement).value).toBe('barclays');
  });

  it('emits update:search when typing', async () => {
    const wrapper = mount(PortfolioControls, { props: { hideClosed: false, grouped: false, search: '' } });
    await wrapper.find('input[type="search"]').setValue('monzo');
    expect(wrapper.emitted('update:search')?.[0]).toStrictEqual(['monzo']);
  });
});
