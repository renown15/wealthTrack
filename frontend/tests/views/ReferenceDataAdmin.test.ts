import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ReferenceDataAdmin from '@/views/ReferenceDataAdmin.vue';

// Mock dependent services
vi.mock('@/services/ReferenceDataService', () => ({
  referenceDataService: {
    listAll: vi.fn(() =>
      Promise.resolve([
        {
          id: 1,
          classKey: 'account_type',
          referenceValue: 'Checking',
          sortIndex: 0,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ]),
    ),
    create: vi.fn(() => Promise.resolve({ id: 2 })),
    update: vi.fn(() => Promise.resolve({ id: 1 })),
    delete: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('@/router', () => ({
  getRouter: vi.fn(() => ({
    getPortfolioController: () => ({
      switchView: vi.fn(),
    }),
  })),
}));

describe('ReferenceDataAdmin.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component', async () => {
    const wrapper = mount(ReferenceDataAdmin);
    await flushPromises();

    expect(wrapper.find('.page-view').exists()).toBe(true);
  });

  it('displays header title', async () => {
    const wrapper = mount(ReferenceDataAdmin);
    await flushPromises();

    expect(wrapper.text()).toContain('Reference Data Management');
  });

  it('renders add button', async () => {
    const wrapper = mount(ReferenceDataAdmin);
    await flushPromises();

    const buttons = wrapper.findAll('button');
    expect(buttons.some((btn) => btn.text().includes('Add'))).toBe(true);
  });

  it('displays reference data after loading', async () => {
    const wrapper = mount(ReferenceDataAdmin);
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain('Checking');
  });
});
