import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseModal from '@/components/BaseModal.vue';

describe('BaseModal', () => {
  it('does not render when open is false', () => {
    const wrapper = mount(BaseModal, { props: { open: false } });
    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
  });

  it('renders when open is true', () => {
    const wrapper = mount(BaseModal, { props: { open: true } });
    expect(wrapper.find('[data-testid="base-modal"]').exists()).toBe(true);
  });

  it('renders title text', () => {
    const wrapper = mount(BaseModal, { props: { open: true, title: 'My Modal' } });
    expect(wrapper.text()).toContain('My Modal');
  });

  it('emits close when close button clicked', async () => {
    const wrapper = mount(BaseModal, { props: { open: true, title: 'Test' } });
    await wrapper.find('.btn-close').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits close when overlay mousedown fires on self', async () => {
    const wrapper = mount(BaseModal, { props: { open: true } });
    await wrapper.find('.modal-overlay').trigger('mousedown');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('applies small size class', () => {
    const wrapper = mount(BaseModal, { props: { open: true, size: 'small' } });
    expect(wrapper.find('.modal-content--small').exists()).toBe(true);
  });

  it('applies large size class', () => {
    const wrapper = mount(BaseModal, { props: { open: true, size: 'large' } });
    expect(wrapper.find('.modal-content--large').exists()).toBe(true);
  });

  it('applies medium size class by default', () => {
    const wrapper = mount(BaseModal, { props: { open: true } });
    expect(wrapper.find('.modal-content--medium').exists()).toBe(true);
  });

  it('renders default slot content', () => {
    const wrapper = mount(BaseModal, {
      props: { open: true },
      slots: { default: '<p>Body content</p>' },
    });
    expect(wrapper.text()).toContain('Body content');
  });

  it('renders header slot content', () => {
    const wrapper = mount(BaseModal, {
      props: { open: true },
      slots: { header: '<h1>Custom Header</h1>' },
    });
    expect(wrapper.text()).toContain('Custom Header');
  });

  it('renders footer slot content', () => {
    const wrapper = mount(BaseModal, {
      props: { open: true },
      slots: { footer: '<button>Footer Btn</button>' },
    });
    expect(wrapper.text()).toContain('Footer Btn');
  });
});
