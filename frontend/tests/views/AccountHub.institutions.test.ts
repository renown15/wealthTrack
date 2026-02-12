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

describe('AccountHub - Institution interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPortfolioInstance = createMockPortfolio();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle edit-institution event', async () => {
    const testInstitution: Institution = { id: 1, userId: 1, name: 'Chase Bank', createdAt: '2024-01-01', updatedAt: '2024-01-01' };

    mockPortfolioInstance.state.items = [
      { account: { id: 1, userId: 1, institutionId: 1, name: 'Checking', typeId: 1, statusId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' }, institution: testInstitution, latestBalance: { id: 1, accountId: 1, userId: 1, eventType: 'balance', value: '1000', createdAt: '2024-01-01', updatedAt: '2024-01-01' } },
    ];
    mockPortfolioInstance.state.institutions = [testInstitution];

    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const instList = wrapper.findComponent({ name: 'InstitutionsList' });
    if (instList.exists()) {
      await instList.vm.$emit('edit-institution', testInstitution);
      await wrapper.vm.$nextTick();

      const modal = wrapper.find('[data-testid="add-account-modal"]');
      expect(modal.exists()).toBe(true);
    }
  });

  it('should handle delete-institution event', async () => {
    const testInstitution: Institution = { id: 1, userId: 1, name: 'Bank of America', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
    mockPortfolioInstance.state.items = [
      { account: { id: 1, userId: 1, institutionId: 1, name: 'Checking', typeId: 1, statusId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' }, institution: testInstitution, latestBalance: { id: 1, accountId: 1, userId: 1, eventType: 'balance', value: '1000', createdAt: '2024-01-01', updatedAt: '2024-01-01' } },
    ];
    mockPortfolioInstance.state.institutions = [testInstitution];

    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const instList = wrapper.findComponent({ name: 'InstitutionsList' });
    if (instList.exists()) {
      await instList.vm.$emit('delete-institution', 1, 'Bank of America');
      await wrapper.vm.$nextTick();

      const deleteModal = wrapper.find('[data-testid="delete-confirm-modal"]');
      expect(deleteModal.exists()).toBe(true);
    }
  });
});
