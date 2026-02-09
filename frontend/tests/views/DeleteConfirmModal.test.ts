import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DeleteConfirmModal from '@/views/AccountHub/DeleteConfirmModal.vue';

describe('DeleteConfirmModal', () => {
  it('does not render when open is false', () => {
    const wrapper = mount(DeleteConfirmModal, {
      props: {
        open: false,
        itemName: 'Test Account',
      },
    });

    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
  });

  it('renders when open is true with item name', () => {
    const wrapper = mount(DeleteConfirmModal, {
      props: {
        open: true,
        itemName: 'My Savings Account',
      },
    });

    expect(wrapper.text()).toContain('Confirm Delete');
    expect(wrapper.text()).toContain('My Savings Account');
    expect(wrapper.text()).toContain('This action cannot be undone');
  });

  it('emits close event when Cancel clicked', async () => {
    const wrapper = mount(DeleteConfirmModal, {
      props: {
        open: true,
        itemName: 'Test',
      },
    });

    const cancelBtn = wrapper.findAll('button').find((btn) => btn.text() === 'Cancel');
    await cancelBtn?.trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits close event when overlay clicked', async () => {
    const wrapper = mount(DeleteConfirmModal, {
      props: {
        open: true,
        itemName: 'Test',
      },
    });

    await wrapper.find('.modal-overlay').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits confirm event when Delete button clicked', async () => {
    const wrapper = mount(DeleteConfirmModal, {
      props: {
        open: true,
        itemName: 'Test',
      },
    });

    const deleteBtn = wrapper.findAll('button').find((btn) => btn.text() === 'Delete');
    await deleteBtn?.trigger('click');

    expect(wrapper.emitted('confirm')).toBeTruthy();
  });
});
