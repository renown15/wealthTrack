import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseResourceModal from '@/components/BaseResourceModal.vue';

describe('BaseResourceModal', () => {
  it('does not render when open is false', () => {
    const wrapper = mount(BaseResourceModal, { props: { open: false, title: 'Test' } });
    expect(wrapper.find('[data-testid="base-modal"]').exists()).toBe(false);
  });

  it('renders when open is true', () => {
    const wrapper = mount(BaseResourceModal, { props: { open: true, title: 'Test Modal' } });
    expect(wrapper.find('[data-testid="base-modal"]').exists()).toBe(true);
  });

  it('renders title', () => {
    const wrapper = mount(BaseResourceModal, { props: { open: true, title: 'Edit Account' } });
    expect(wrapper.text()).toContain('Edit Account');
  });

  it('shows Save as default saveButtonText', () => {
    const wrapper = mount(BaseResourceModal, { props: { open: true, title: 'Test' } });
    expect(wrapper.findAll('button').some((b) => b.text() === 'Save')).toBe(true);
  });

  it('shows custom saveButtonText', () => {
    const wrapper = mount(BaseResourceModal, {
      props: { open: true, title: 'Test', saveButtonText: 'Create' },
    });
    expect(wrapper.findAll('button').some((b) => b.text() === 'Create')).toBe(true);
  });

  it('shows Cancel button', () => {
    const wrapper = mount(BaseResourceModal, { props: { open: true, title: 'Test' } });
    expect(wrapper.findAll('button').some((b) => b.text() === 'Cancel')).toBe(true);
  });

  it('emits close when Cancel clicked', async () => {
    const wrapper = mount(BaseResourceModal, { props: { open: true, title: 'Test' } });
    const cancelBtn = wrapper.findAll('button').find((b) => b.text() === 'Cancel');
    await cancelBtn?.trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits save when Save clicked', async () => {
    const wrapper = mount(BaseResourceModal, { props: { open: true, title: 'Test' } });
    const saveBtn = wrapper.findAll('button').find((b) => b.text() === 'Save');
    await saveBtn?.trigger('click');
    expect(wrapper.emitted('save')).toBeTruthy();
  });

  it('renders slot content', () => {
    const wrapper = mount(BaseResourceModal, {
      props: { open: true, title: 'Test' },
      slots: { default: '<input id="test-input" />' },
    });
    expect(wrapper.find('#test-input').exists()).toBe(true);
  });
});
