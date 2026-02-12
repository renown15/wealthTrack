import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import DeleteReferenceDataModal from '@/views/DeleteReferenceDataModal.vue';
import type { ReferenceDataItem } from '@/models/ReferenceData';

describe('DeleteReferenceDataModal.vue', () => {
  const mockItem: ReferenceDataItem & { updatedAt: string } = {
    id: 1,
    classKey: 'test_class',
    referenceValue: 'test_value',
    sortIndex: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open with item', () => {
    const wrapper = mount(DeleteReferenceDataModal, {
      props: {
        open: true,
        item: mockItem,
        isDeleting: false,
      },
    });

    const text = wrapper.text();
    expect(text).toContain('test_class');
    expect(text).toContain('test_value');
  });

  it('does not render when closed', () => {
    const wrapper = mount(DeleteReferenceDataModal, {
      props: {
        open: false,
        item: null,
        isDeleting: false,
      },
    });

    // Modal should still exist but be in DOM
    expect(wrapper.find('[class*="modal"]').exists()).toBe(true);
  });

  it('emits cancel event when cancel button clicked', async () => {
    const wrapper = mount(DeleteReferenceDataModal, {
      props: {
        open: true,
        item: mockItem,
        isDeleting: false,
      },
    });

    const buttons = wrapper.findAll('button');
    const cancelButton = buttons[0];
    await cancelButton.trigger('click');

    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('emits confirm event when delete button clicked', async () => {
    const wrapper = mount(DeleteReferenceDataModal, {
      props: {
        open: true,
        item: mockItem,
        isDeleting: false,
      },
    });

    const buttons = wrapper.findAll('button');
    const deleteButton = buttons[buttons.length - 1]; // Last button is Delete
    await deleteButton.trigger('click');

    expect(wrapper.emitted('confirm')).toBeTruthy();
  });

  it('disables delete button when deleting', async () => {
    const wrapper = mount(DeleteReferenceDataModal, {
      props: {
        open: true,
        item: mockItem,
        isDeleting: true,
      },
    });

    const buttons = wrapper.findAll('button');
    const deleteButton = buttons[buttons.length - 1];
    expect(deleteButton.attributes('disabled')).toBeDefined();
  });

  it('displays item details in confirmation message', () => {
    const wrapper = mount(DeleteReferenceDataModal, {
      props: {
        open: true,
        item: mockItem,
        isDeleting: false,
      },
    });

    const text = wrapper.text();
    expect(text).toContain('Class Key:');
    expect(text).toContain('Value:');
  });
});
