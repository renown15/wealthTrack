import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { reactive, computed } from 'vue';
import AccountHub from '@views/AccountHub/AccountHub.vue';
import type { PortfolioItem, Institution } from '@/models/Portfolio';

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
    template: '<div data-testid="account-hub-stats" @click="$emit(\'create-account\')"><slot /></div>',
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

describe('AccountHub - Modal interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPortfolioInstance = createMockPortfolio();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should open create account modal from empty state', async () => {
    mockPortfolioInstance.state.items = [];
    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const createButton = wrapper.find('button.btn-primary');
    await createButton.trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="add-account-modal"]').exists()).toBe(true);
  });

  it('should open modal from stats create-account event', async () => {
    const testInstitution: Institution = { id: 1, userId: 1, name: 'Bank A', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
    mockPortfolioInstance.state.items = [{ account: { id: 1, userId: 1, institutionId: 1, name: 'Checking', typeId: 1, statusId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' }, institution: testInstitution, latestBalance: { id: 1, accountId: 1, userId: 1, eventType: 'balance', value: '1000', createdAt: '2024-01-01', updatedAt: '2024-01-01' } }];
    mockPortfolioInstance.state.institutions = [testInstitution];

    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const statsComponent = wrapper.findComponent({ name: 'AccountHubStats' });
    await statsComponent.vm.$emit('create-account');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="add-account-modal"]').exists()).toBe(true);
  });

  it('should open institution creation modal from stats', async () => {
    mockPortfolioInstance.state.items = [{ account: { id: 1, userId: 1, institutionId: 1, name: 'Checking', typeId: 1, statusId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' }, institution: null, latestBalance: { id: 1, accountId: 1, userId: 1, eventType: 'balance', value: '1000', createdAt: '2024-01-01', updatedAt: '2024-01-01' } }];
    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const statsComponent = wrapper.findComponent({ name: 'AccountHubStats' });
    await statsComponent.vm.$emit('create-institution');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="add-account-modal"]').exists()).toBe(true);
  });

  it('should open edit account modal from table event', async () => {
    const testInstitution: Institution = { id: 1, userId: 1, name: 'Bank A', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
    const testAccount = { id: 1, userId: 1, institutionId: 1, name: 'Savings', typeId: 1, statusId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' };
    mockPortfolioInstance.state.items = [{ account: testAccount, institution: testInstitution, latestBalance: { id: 1, accountId: 1, userId: 1, eventType: 'balance', value: '5000', createdAt: '2024-01-01', updatedAt: '2024-01-01' } }];
    mockPortfolioInstance.state.institutions = [testInstitution];

    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const tableComponent = wrapper.findComponent({ name: 'AccountHubTable' });
    await tableComponent.vm.$emit('edit-account', testAccount);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="add-account-modal"]').exists()).toBe(true);
  });

  it('should open delete confirmation modal', async () => {
    const testInstitution: Institution = { id: 1, userId: 1, name: 'Bank A', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
    mockPortfolioInstance.state.items = [{ account: { id: 1, userId: 1, institutionId: 1, name: 'Checking', typeId: 1, statusId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' }, institution: testInstitution, latestBalance: { id: 1, accountId: 1, userId: 1, eventType: 'balance', value: '2000', createdAt: '2024-01-01', updatedAt: '2024-01-01' } }];
    mockPortfolioInstance.state.institutions = [testInstitution];

    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const tableComponent = wrapper.findComponent({ name: 'AccountHubTable' });
    await tableComponent.vm.$emit('delete-item', 1, 'Checking');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="delete-confirm-modal"]').exists()).toBe(true);
  });

  it('should close add account modal on close event', async () => {
    mockPortfolioInstance.state.items = [];
    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const createButton = wrapper.find('button.btn-primary');
    await createButton.trigger('click');
    await wrapper.vm.$nextTick();

    let modal = wrapper.find('[data-testid="add-account-modal"]');
    expect(modal.exists()).toBe(true);

    await wrapper.findComponent({ name: 'AddAccountModal' }).vm.$emit('close');
    await wrapper.vm.$nextTick();
    modal = wrapper.find('[data-testid="add-account-modal"]');
    expect(modal.exists()).toBe(false);
  });

  it('should close delete modal on close event', async () => {
    mockPortfolioInstance.state.items = [{ account: { id: 1, userId: 1, institutionId: 1, name: 'Checking', typeId: 1, statusId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' }, institution: null, latestBalance: { id: 1, accountId: 1, userId: 1, eventType: 'balance', value: '1000', createdAt: '2024-01-01', updatedAt: '2024-01-01' } }];
    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const tableComponent = wrapper.findComponent({ name: 'AccountHubTable' });
    await tableComponent.vm.$emit('delete-item', 1, 'Checking');
    await wrapper.vm.$nextTick();

    let deleteModal = wrapper.find('[data-testid="delete-confirm-modal"]');
    expect(deleteModal.exists()).toBe(true);

    await wrapper.findComponent({ name: 'DeleteConfirmModal' }).vm.$emit('close');
    await wrapper.vm.$nextTick();
    deleteModal = wrapper.find('[data-testid="delete-confirm-modal"]');
    expect(deleteModal.exists()).toBe(false);
  });
});
