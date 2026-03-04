import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import ReferenceDataAdmin from '@/views/ReferenceDataAdmin.vue';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import AddReferenceDataModal from '@views/AddReferenceDataModal.vue';
import DeleteReferenceDataModal from '@views/DeleteReferenceDataModal.vue';
import ReferenceDataTable from '@views/ReferenceDataTable.vue';

const mockData = ref<ReferenceDataItem[]>([
  { id: 1, classKey: 'account_type', referenceValue: 'Checking', sortIndex: 0,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' } as ReferenceDataItem,
]);
const mockLoadData = vi.fn();
const mockCreateItem = vi.fn().mockResolvedValue({ success: true });
const mockUpdateItem = vi.fn().mockResolvedValue({ success: true });
const mockDeleteItem = vi.fn().mockResolvedValue({ success: true });
const mockError = ref<string | null>(null);

vi.mock('@/composables/useReferenceDataCrud', () => ({
  useReferenceDataCrud: vi.fn(() => ({
    loading: ref(false),
    error: mockError,
    data: mockData,
    loadData: mockLoadData,
    createItem: mockCreateItem,
    updateItem: mockUpdateItem,
    deleteItem: mockDeleteItem,
  })),
}));

describe('ReferenceDataAdmin interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData.value = [
      { id: 1, classKey: 'account_type', referenceValue: 'Checking', sortIndex: 0,
        createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' } as ReferenceDataItem,
    ];
    mockError.value = null;
    mockCreateItem.mockResolvedValue({ success: true });
    mockUpdateItem.mockResolvedValue({ success: true });
    mockDeleteItem.mockResolvedValue({ success: true });
  });

  it('openAddForm: clicking Add button opens form', async () => {
    const wrapper = mount(ReferenceDataAdmin);
    await flushPromises();
    await wrapper.find('button.btn-primary').trigger('click');
    const modal = wrapper.findComponent(AddReferenceDataModal);
    expect((modal.props() as any).open).toBe(true);
  });

  it('closeAddForm: @close from modal closes form', async () => {
    const wrapper = mount(ReferenceDataAdmin);
    await flushPromises();
    await wrapper.find('button.btn-primary').trigger('click');
    await wrapper.findComponent(AddReferenceDataModal).vm.$emit('close');
    const modal = wrapper.findComponent(AddReferenceDataModal);
    expect((modal.props() as any).open).toBe(false);
  });

  it('submitNewForm: @submit creates item and closes form', async () => {
    const wrapper = mount(ReferenceDataAdmin);
    await flushPromises();
    await wrapper.find('button.btn-primary').trigger('click');
    await wrapper.findComponent(AddReferenceDataModal).vm.$emit('submit', {
      classKey: 'test', referenceValue: 'Test Value', sortIndex: 1,
    });
    await flushPromises();
    expect(mockCreateItem).toHaveBeenCalled();
  });

  it('submitNewForm: sets formError when fields missing', async () => {
    const wrapper = mount(ReferenceDataAdmin);
    await flushPromises();
    await wrapper.find('button.btn-primary').trigger('click');
    await wrapper.findComponent(AddReferenceDataModal).vm.$emit('submit', {
      classKey: '', referenceValue: '', sortIndex: undefined,
    });
    expect(wrapper.text()).toContain('Required fields missing');
  });

  it('deleteItem: @delete from table opens confirm modal', async () => {
    const wrapper = mount(ReferenceDataAdmin);
    await flushPromises();
    await wrapper.findComponent(ReferenceDataTable).vm.$emit('delete', 1);
    const confirmModal = wrapper.findComponent(DeleteReferenceDataModal);
    expect((confirmModal.props() as any).open).toBe(true);
  });

  it('cancelDelete: @cancel from confirm modal closes it', async () => {
    const wrapper = mount(ReferenceDataAdmin);
    await flushPromises();
    await wrapper.findComponent(ReferenceDataTable).vm.$emit('delete', 1);
    await wrapper.findComponent(DeleteReferenceDataModal).vm.$emit('cancel');
    const confirmModal = wrapper.findComponent(DeleteReferenceDataModal);
    expect((confirmModal.props() as any).open).toBe(false);
  });

  it('confirmDelete: @confirm deletes the item', async () => {
    const wrapper = mount(ReferenceDataAdmin);
    await flushPromises();
    await wrapper.findComponent(ReferenceDataTable).vm.$emit('delete', 1);
    await wrapper.findComponent(DeleteReferenceDataModal).vm.$emit('confirm');
    await flushPromises();
    expect(mockDeleteItem).toHaveBeenCalledWith(1);
  });

  it('handleEdit: @edit from table updates item', async () => {
    const wrapper = mount(ReferenceDataAdmin);
    await flushPromises();
    await wrapper.findComponent(ReferenceDataTable).vm.$emit('edit', 1, { referenceValue: 'Updated', sortIndex: 1 });
    await flushPromises();
    expect(mockUpdateItem).toHaveBeenCalledWith(1, expect.objectContaining({ referenceValue: 'Updated' }));
  });

  it('clearError: clicking x button clears the error', async () => {
    mockError.value = 'Something went wrong';
    const wrapper = mount(ReferenceDataAdmin);
    await flushPromises();
    await wrapper.find('button.btn-close').trigger('click');
    expect(wrapper.text()).not.toContain('Something went wrong');
  });
});
