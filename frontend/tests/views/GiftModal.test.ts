import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import GiftModal from '@views/AccountHub/GiftModal.vue';

describe('GiftModal', () => {
  it('does not render when closed', () => {
    const wrapper = mount(GiftModal, { props: { open: false } });
    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
  });

  it('renders when open', () => {
    const wrapper = mount(GiftModal, { props: { open: true } });
    expect(wrapper.find('.modal-overlay').exists()).toBe(true);
    expect(wrapper.find('.modal-title').text()).toBe('Record Gift');
  });

  it('emits close when cancel clicked', async () => {
    const wrapper = mount(GiftModal, { props: { open: true } });
    await wrapper.find('.btn-modal-secondary').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('save button is disabled when form is incomplete', () => {
    const wrapper = mount(GiftModal, { props: { open: true } });
    const saveBtn = wrapper.find('.btn-primary');
    expect((saveBtn.element as HTMLButtonElement).disabled).toBe(true);
  });

  it('does not show shares field for non-shares accounts', () => {
    const wrapper = mount(GiftModal, { props: { open: true, accountType: 'Cash ISA' } });
    const labels = wrapper.findAll('.form-label').map((l) => l.text());
    expect(labels).not.toContain('Number of Shares');
  });

  it('shows shares field for Shares account type', () => {
    const wrapper = mount(GiftModal, { props: { open: true, accountType: 'Shares' } });
    const labels = wrapper.findAll('.form-label').map((l) => l.text());
    expect(labels).toContain('Number of Shares');
  });

  it('emits save with correct values for cash gift', async () => {
    const wrapper = mount(GiftModal, { props: { open: true, accountType: 'Current Account' } });
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('Grandparent');
    await inputs[1].setValue('2022-06-01');
    await inputs[2].setValue('5000');
    const saveBtn = wrapper.find('.btn-primary');
    await saveBtn.trigger('click');
    const emitted = wrapper.emitted('save');
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toEqual(['Grandparent', '2022-06-01', '5000', null]);
  });

  it('emits save with shares for shares gift', async () => {
    const wrapper = mount(GiftModal, { props: { open: true, accountType: 'Shares' } });
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('Parent');
    await inputs[1].setValue('2021-01-10');
    await inputs[2].setValue('8000');
    await inputs[3].setValue('100');
    await wrapper.find('.btn-primary').trigger('click');
    const emitted = wrapper.emitted('save');
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toEqual(['Parent', '2021-01-10', '8000', '100']);
  });

  it('requires shares amount for shares accounts', () => {
    const wrapper = mount(GiftModal, { props: { open: true, accountType: 'Shares' } });
    const saveBtn = wrapper.find('.btn-primary');
    expect((saveBtn.element as HTMLButtonElement).disabled).toBe(true);
  });
});
