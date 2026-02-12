import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { reactive, computed } from 'vue';
import AccountHub from '@views/AccountHub/AccountHub.vue';
import type { PortfolioItem, Institution } from '@/models/WealthTrackDataModels';

const createMockPortfolio = () => {
  const state = reactive({
    items: [] as PortfolioItem[],
    institutions: [] as Institution[],
    error: null as string | null,
    loading: false,
  });

  return {
    state,
    totalValue: computed(() => state.items.reduce((sum: number, item: PortfolioItem) => sum + parseFloat(item.latestBalance?.value || '0'), 0)),
    accountCount: computed(() => state.items.length),
    loadPortfolio: vi.fn(async () => {}),
    createAccount: vi.fn(async () => {}),
    updateAccount: vi.fn(async () => {}),
    deleteAccount: vi.fn(async () => {}),
    createInstitution: vi.fn(async () => {}),
    updateInstitution: vi.fn(async () => {}),
    deleteInstitution: vi.fn(async () => {}),
    clearError: vi.fn(() => { state.error = null; }),
  };
};

let mockPortfolioInstance = createMockPortfolio();

vi.mock('@/composables/usePortfolio', () => ({
  usePortfolio: () => mockPortfolioInstance,
}));

vi.mock('@views/AccountHub/AccountHubStats.vue', () => ({
  default: {
    name: 'AccountHubStats',
    template: '<div data-testid="account-hub-stats"><slot /></div>',
    props: ['totalValue', 'accountCount'],
    emits: ['create-account', 'create-institution'],
  },
}));

vi.mock('@views/AccountHub/AccountHubTable.vue', () => ({
  default: {
    name: 'AccountHubTable',
    template: '<div data-testid="account-hub-table"><slot /></div>',
    props: ['items'],
    emits: ['edit-account', 'delete-item'],
  },
}));

vi.mock('@views/AccountHub/AddAccountModal.vue', () => ({
  default: {
    name: 'AddAccountModal',
    template: '<div v-if="open" data-testid="add-account-modal"><slot /></div>',
    props: ['open', 'type', 'resourceType', 'institutions', 'initialName', 'initialInstitutionId'],
    emits: ['close', 'save'],
  },
}));

vi.mock('@views/AccountHub/DeleteConfirmModal.vue', () => ({
  default: {
    name: 'DeleteConfirmModal',
    template: '<div v-if="open" data-testid="delete-confirm-modal"><slot /></div>',
    props: ['open', 'itemName'],
    emits: ['close', 'confirm'],
  },
}));

vi.mock('@views/AccountHub/InstitutionsList.vue', () => ({
  default: {
    name: 'InstitutionsList',
    template: '<div data-testid="institutions-list"><slot /></div>',
    props: ['institutions'],
    emits: ['edit-institution', 'delete-institution'],
  },
}));

describe('AccountHub - Component rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPortfolioInstance = createMockPortfolio();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should mount component', () => {
    const wrapper = mount(AccountHub);
    expect(wrapper.exists()).toBe(true);
  });

  it('should load portfolio on mount', async () => {
    mount(AccountHub);
    expect(mockPortfolioInstance.loadPortfolio).toHaveBeenCalled();
  });

  it('should show empty state when no accounts', async () => {
    mockPortfolioInstance.state.items = [];
    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('No accounts yet');
  });

  it('should show loading state', async () => {
    mockPortfolioInstance.state.loading = true;
    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const loadingState = wrapper.find('.loading-state');
    expect(loadingState.exists()).toBe(true);
  });

  it('should show error banner with error message', async () => {
    mockPortfolioInstance.state.error = 'Test error message';
    mockPortfolioInstance.state.items = [
      { account: { id: 1, userId: 1, institutionId: 1, name: 'Checking', typeId: 1, statusId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' }, institution: null, latestBalance: { id: 1, accountId: 1, userId: 1, eventType: 'balance', value: '1000', createdAt: '2024-01-01', updatedAt: '2024-01-01' } },
    ];

    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const errorBanner = wrapper.find('.error-banner');
    expect(errorBanner.exists()).toBe(true);
    expect(errorBanner.text()).toContain('Test error message');
  });

  it('should clear error on banner close', async () => {
    mockPortfolioInstance.state.error = 'Error message';
    mockPortfolioInstance.state.items = [
      { account: { id: 1, userId: 1, institutionId: 1, name: 'Checking', typeId: 1, statusId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' }, institution: null, latestBalance: { id: 1, accountId: 1, userId: 1, eventType: 'balance', value: '1000', createdAt: '2024-01-01', updatedAt: '2024-01-01' } },
    ];

    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const closeButton = wrapper.find('.error-banner button');
    await closeButton.trigger('click');

    expect(mockPortfolioInstance.clearError).toHaveBeenCalled();
  });

  it('should render stats component', async () => {
    mockPortfolioInstance.state.items = [
      { account: { id: 1, userId: 1, institutionId: 1, name: 'Checking', typeId: 1, statusId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' }, institution: null, latestBalance: { id: 1, accountId: 1, userId: 1, eventType: 'balance', value: '2000', createdAt: '2024-01-01', updatedAt: '2024-01-01' } },
    ];

    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const stats = wrapper.find('[data-testid="account-hub-stats"]');
    expect(stats.exists()).toBe(true);
  });

  it('should display accounts table with items', async () => {
    const testInstitution: Institution = { id: 1, userId: 1, name: 'Bank A', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
    mockPortfolioInstance.state.items = [
      { account: { id: 1, userId: 1, institutionId: 1, name: 'Checking', typeId: 1, statusId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' }, institution: testInstitution, latestBalance: { id: 1, accountId: 1, userId: 1, eventType: 'balance', value: '2000', createdAt: '2024-01-01', updatedAt: '2024-01-01' } },
      { account: { id: 2, userId: 1, institutionId: 1, name: 'Savings', typeId: 1, statusId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' }, institution: testInstitution, latestBalance: { id: 2, accountId: 2, userId: 1, eventType: 'balance', value: '5000', createdAt: '2024-01-01', updatedAt: '2024-01-01' } },
    ];
    mockPortfolioInstance.state.institutions = [testInstitution];

    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const table = wrapper.find('[data-testid="account-hub-table"]');
    expect(table.exists()).toBe(true);
  });
});
