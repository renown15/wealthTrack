import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import OutgoingsTableRow from '@/views/OutgoingsHub/OutgoingsTableRow.vue';
import type { PortfolioItem } from '@models/WealthTrackDataModels';

function makeItem(overrides: Partial<PortfolioItem['account']> = {}): PortfolioItem {
  return {
    account: {
      id: 1,
      name: 'Gas Account',
      accountNumber: 'ACC123',
      monthlyCost: '45.00',
      renewalDate: null,
      ...overrides,
    } as never,
    institution: { id: 1, name: 'British Gas' } as never,
    accountType: 'Utility - Gas',
    docCount: 2,
    events: [],
  } as never;
}

describe('OutgoingsTableRow', () => {
  it('renders account info', () => {
    const wrapper = mount(OutgoingsTableRow, { props: { item: makeItem() } });
    expect(wrapper.text()).toContain('British Gas');
    expect(wrapper.text()).toContain('Gas Account');
    expect(wrapper.text()).toContain('Utility - Gas');
    expect(wrapper.text()).toContain('ACC123');
    expect(wrapper.text()).toContain('£45.00');
  });

  it('shows — for missing monthly cost', () => {
    const wrapper = mount(OutgoingsTableRow, { props: { item: makeItem({ monthlyCost: null }) } });
    expect(wrapper.text()).toContain('—');
  });

  it('shows the renewal type and "Rolling" when no renewal date', () => {
    const wrapper = mount(OutgoingsTableRow, {
      props: { item: makeItem({ renewalType: 'Quarterly', renewalDate: null }) },
    });
    expect(wrapper.text()).toContain('Quarterly');
    expect(wrapper.text()).toContain('Rolling');
  });

  it('shows the renewal date when present (not Rolling)', () => {
    const wrapper = mount(OutgoingsTableRow, {
      props: { item: makeItem({ renewalType: 'Annually', renewalDate: '15/06/2027' }) },
    });
    expect(wrapper.text()).not.toContain('Rolling');
    expect(wrapper.text()).toMatch(/Jun|2027/);
  });

  it('shows doc count button', () => {
    const wrapper = mount(OutgoingsTableRow, { props: { item: makeItem() } });
    expect(wrapper.text()).toContain('2');
  });

  it('applies red row class when renewing soon', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const dd = String(future.getDate()).padStart(2, '0');
    const mm = String(future.getMonth() + 1).padStart(2, '0');
    const yyyy = future.getFullYear();
    const soon = `${dd}/${mm}/${yyyy}`;
    const wrapper = mount(OutgoingsTableRow, { props: { item: makeItem({ renewalDate: soon }) } });
    expect(wrapper.find('tr').classes()).toContain('bg-red-50');
  });

  it('does not apply red row class when not renewing soon', () => {
    const wrapper = mount(OutgoingsTableRow, { props: { item: makeItem({ renewalDate: null }) } });
    expect(wrapper.find('tr').classes()).not.toContain('bg-red-50');
  });

  it('emits edit when edit button clicked', async () => {
    const wrapper = mount(OutgoingsTableRow, { props: { item: makeItem() } });
    await wrapper.findAll('button')[1].trigger('click');
    expect(wrapper.emitted('edit')).toBeTruthy();
  });

  it('emits delete when delete button clicked', async () => {
    const wrapper = mount(OutgoingsTableRow, { props: { item: makeItem() } });
    await wrapper.findAll('button')[2].trigger('click');
    expect(wrapper.emitted('delete')).toBeTruthy();
  });

  it('emits showDocs when docs button clicked', async () => {
    const wrapper = mount(OutgoingsTableRow, { props: { item: makeItem() } });
    await wrapper.findAll('button')[0].trigger('click');
    expect(wrapper.emitted('showDocs')).toBeTruthy();
  });
});
