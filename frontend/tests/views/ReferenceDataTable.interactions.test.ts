import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import ReferenceDataTable from '@/views/ReferenceDataTable.vue';
import ReferenceDataTableActions from '@/views/ReferenceDataTableActions.vue';

const mockData = [
  {
    id: 1, classKey: 'account_type', referenceValue: 'Checking', sortIndex: 0,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2, classKey: 'account_type', referenceValue: 'Savings', sortIndex: 1,
    createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-02-01T00:00:00Z',
  },
];

describe('ReferenceDataTable interactions', () => {
  it('toggleSort: clicking column header emits sort-change', async () => {
    const wrapper = mount(ReferenceDataTable, { 
      props: { data: mockData, sortKey: 'classKey', sortDirection: 'asc' } 
    });
    const header = wrapper.find('thead th');
    await header.trigger('click');
    expect(wrapper.emitted('sort-change')).toBeTruthy();
  });

  it('toggleSort: clicking same column toggles to desc', async () => {
    const wrapper = mount(ReferenceDataTable, {
      props: { data: mockData, sortKey: 'classKey', sortDirection: 'asc' },
    });
    const header = wrapper.find('thead th');
    await header.trigger('click');
    const emitted = wrapper.emitted('sort-change');
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toContain('desc');
  });

  it('handleStartEdit: clicking edit button enters edit mode', async () => {
    const wrapper = mount(ReferenceDataTable, { 
      props: { data: mockData, sortKey: 'classKey', sortDirection: 'asc' } 
    });
    const editBtn = wrapper.find('button.btn-icon-edit');
    await editBtn.trigger('click');
    await nextTick();
    expect(wrapper.find('tbody input.form-input').exists()).toBe(true);
  });

  it('cancelEdit: clicking cancel exits edit mode', async () => {
    const wrapper = mount(ReferenceDataTable, { 
      props: { data: mockData, sortKey: 'classKey', sortDirection: 'asc' } 
    });
    const editBtn = wrapper.find('button.btn-icon-edit');
    await editBtn.trigger('click');
    await nextTick();
    expect(wrapper.find('tbody input.form-input').exists()).toBe(true);
    const cancelBtn = wrapper.findAll('button').find(b => b.attributes('title') === 'Cancel');
    await cancelBtn!.trigger('click');
    await nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('tbody input.form-input').exists()).toBe(false);
  });

  it('handleSaveEdit: clicking save emits edit event', async () => {
    const wrapper = mount(ReferenceDataTable, { 
      props: { data: mockData, sortKey: 'classKey', sortDirection: 'asc' } 
    });
    const editBtn = wrapper.find('button.btn-icon-edit');
    await editBtn.trigger('click');
    await nextTick();
    const saveBtn = wrapper.findAll('button').find(b => b.attributes('title') === 'Save');
    await saveBtn!.trigger('click');
    expect(wrapper.emitted('edit')).toBeTruthy();
  });

  it('saveEdit skips emit when referenceValue cleared', async () => {
    const wrapper = mount(ReferenceDataTable, { 
      props: { data: mockData, sortKey: 'classKey', sortDirection: 'asc' } 
    });
    const editBtn = wrapper.find('button.btn-icon-edit');
    await editBtn.trigger('click');
    await nextTick();
    const input = wrapper.find('tbody input.form-input');
    await input.setValue('');
    await nextTick();
    const saveBtn = wrapper.findAll('button').find(b => b.attributes('title') === 'Save');
    await saveBtn!.trigger('click');
    await nextTick();
    // edit mode remains active (saveEdit returned early, didn't clear editingId)
    expect(wrapper.find('tbody input.form-input').exists()).toBe(true);
  });
});

describe('ReferenceDataTableActions', () => {
  const item = {
    id: 1, classKey: 'account_type', referenceValue: 'Checking', sortIndex: 0,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  };

  it('startEdit: clicking edit button emits start-edit', async () => {
    const wrapper = mount(ReferenceDataTableActions, {
      props: { item, editingId: null, savingId: null, deletingId: null },
    });
    const editBtn = wrapper.find('button.btn-icon-edit');
    await editBtn.trigger('click');
    expect(wrapper.emitted('start-edit')).toBeTruthy();
  });

  it('cancelEdit: clicking cancel button emits cancel-edit', async () => {
    const wrapper = mount(ReferenceDataTableActions, {
      props: { item, editingId: 1, savingId: null, deletingId: null },
    });
    const cancelBtn = wrapper.findAll('button').find(b => b.attributes('title') === 'Cancel');
    await cancelBtn!.trigger('click');
    expect(wrapper.emitted('cancel-edit')).toBeTruthy();
  });

  it('saveEdit: clicking save button emits save-edit', async () => {
    const wrapper = mount(ReferenceDataTableActions, {
      props: { item, editingId: 1, savingId: null, deletingId: null },
    });
    const saveBtn = wrapper.findAll('button').find(b => b.attributes('title') === 'Save');
    await saveBtn!.trigger('click');
    expect(wrapper.emitted('save-edit')).toBeTruthy();
  });
});
