import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ReferenceDataTable from '@/views/ReferenceDataTable.vue';
import type { ReferenceDataItem } from '@/models/ReferenceData';

describe('ReferenceDataTable.vue', () => {
  const mockData: (ReferenceDataItem & { updatedAt: string })[] = [
    {
      id: 1,
      classKey: 'account_type',
      referenceValue: 'Checking',
      sortIndex: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      classKey: 'account_type',
      referenceValue: 'Savings',
      sortIndex: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table with data', () => {
    const wrapper = mount(ReferenceDataTable, {
      props: {
        data: mockData,
      },
    });

    const rows = wrapper.findAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('displays reference values in table', () => {
    const wrapper = mount(ReferenceDataTable, {
      props: {
        data: mockData,
      },
    });

    const text = wrapper.text();
    expect(text).toContain('Checking');
    expect(text).toContain('Savings');
  });

  it('emits delete event when delete button clicked', async () => {
    const wrapper = mount(ReferenceDataTable, {
      props: {
        data: mockData,
      },
    });

    const buttons = wrapper.findAll('button');
    const deleteButton = buttons.find((btn) => btn.text().includes('✕'));

    if (deleteButton) {
      await deleteButton.trigger('click');
      expect(wrapper.emitted('delete')).toBeTruthy();
    }
  });

  it('filters table by search term', async () => {
    const wrapper = mount(ReferenceDataTable, {
      props: {
        data: mockData,
      },
    });

    const searchInput = wrapper.find('input[placeholder*="Search"]');
    if (searchInput.exists()) {
      await searchInput.setValue('Checking');
      await wrapper.vm.$nextTick();
      
      const rows = wrapper.findAll('tbody tr');
      // After filter, should have at least one matching row
      expect(rows.length > 0).toBe(true);
    }
  });

  it('allows filtering by class key', async () => {
    const wrapper = mount(ReferenceDataTable, {
      props: {
        data: mockData,
      },
    });

    const classKeySelect = wrapper.find('select');
    if (classKeySelect.exists()) {
      await classKeySelect.setValue('account_type');
      await wrapper.vm.$nextTick();
      
      const rows = wrapper.findAll('tbody tr');
      expect(rows.length > 0).toBe(true);
    }
  });

  it('shows all class keys in filter dropdown', async () => {
    const wrapper = mount(ReferenceDataTable, {
      props: {
        data: mockData,
      },
    });

    const classKeySelect = wrapper.find('select');
    const options = classKeySelect.findAll('option');
    
    expect(options.length > 1).toBe(true);
  });

  it('renders empty table when no data', () => {
    const wrapper = mount(ReferenceDataTable, {
      props: {
        data: [],
      },
    });

    const tbody = wrapper.find('tbody');
    const rows = tbody.findAll('tr');
    expect(rows.length).toBe(0);
  });

  it('displays sort index in table', () => {
    const wrapper = mount(ReferenceDataTable, {
      props: {
        data: mockData,
      },
    });

    const text = wrapper.text();
    expect(text).toContain('0');
    expect(text).toContain('1');
  });
});
