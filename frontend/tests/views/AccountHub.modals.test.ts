import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { reactive, computed } from 'vue';
import AccountHub from '@views/AccountHub/AccountHub.vue';
import { apiService } from '@/services/ApiService';
import type { PortfolioItem, Institution, AccountEvent } from '@/models/Portfolio';

type AccountHubVm = {
  modalOpen: boolean;
  deleteConfirmOpen: boolean;
  eventsModalOpen: boolean;
  eventsLoading: boolean;
  events: AccountEvent[];
  eventsError?: string | null;
};

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
    emits: ['edit-account', 'delete-item', 'show-events'],
  },
}));

vi.mock('@views/AccountHub/AddAccountModal.vue', () => ({
  default: {
    name: 'AddAccountModal',
    template: '<div v-if="open" data-testid="add-account-modal"><slot /></div>',
    props: [
      'open',
      'type',
      'resourceType',
      'institutions',
      'accountTypes',
      'accountStatuses',
      'initialName',
      'initialInstitutionId',
      'initialTypeId',
      'initialStatusId',
    ],
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

vi.mock('@/services/ApiService', () => ({
  apiService: {
    getAccountEvents: vi.fn(),
    getReferenceData: vi.fn().mockResolvedValue([]),
  },
}));

const resetMocks = (): void => {
  vi.clearAllMocks();
  mockPortfolioInstance = createMockPortfolio();
  vi.mocked(apiService.getAccountEvents).mockReset();
};

const sampleInstitution: Institution = {
  id: 1,
  userId: 1,
  name: 'Test Bank',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const createAccountItem = (): PortfolioItem => ({
  account: {
    id: 1,
    userId: 1,
    institutionId: 1,
    name: 'Checking',
    typeId: 1,
    statusId: 1,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  institution: sampleInstitution,
  latestBalance: {
    id: 1,
    accountId: 1,
    userId: 1,
    eventType: 'balance_update',
    value: '1500.00',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  accountType: 'Checking Account',
  eventCount: 2,
});

const sampleEvents: AccountEvent[] = [
  {
    id: 1,
    accountId: 1,
    userId: 1,
    eventType: 'balance_update',
    value: '1200.00',
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
  },
  {
    id: 2,
    accountId: 1,
    userId: 1,
    eventType: 'interest_payment',
    value: '',
    createdAt: '2024-01-02T12:00:00Z',
    updatedAt: '2024-01-02T12:00:00Z',
  },
];

beforeEach(() => {
  resetMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AccountHub - Modal interactions', () => {

  it('should open create account modal from empty state', async () => {
    mockPortfolioInstance.state.items = [];
    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const statsComponent = wrapper.findComponent({ name: 'AccountHubStats' });
    await statsComponent.vm.$emit('create-account');
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
    await tableComponent.vm.$emit('delete-item', 'account', 1, 'Checking');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="delete-confirm-modal"]').exists()).toBe(true);
  });

  it('should close add account modal on close event', async () => {
    mockPortfolioInstance.state.items = [];
    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const statsComponent = wrapper.findComponent({ name: 'AccountHubStats' });
    await statsComponent.vm.$emit('create-account');
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
    await tableComponent.vm.$emit('delete-item', 'account', 1, 'Checking');
    await wrapper.vm.$nextTick();

    let deleteModal = wrapper.find('[data-testid="delete-confirm-modal"]');
    expect(deleteModal.exists()).toBe(true);

    await wrapper.findComponent({ name: 'DeleteConfirmModal' }).vm.$emit('close');
    await wrapper.vm.$nextTick();
    deleteModal = wrapper.find('[data-testid="delete-confirm-modal"]');
    expect(deleteModal.exists()).toBe(false);
  });

  it('creates an account when the add modal saves', async () => {
    mockPortfolioInstance.state.items = [];
    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const statsComponent = wrapper.findComponent({ name: 'AccountHubStats' });
    await statsComponent.vm.$emit('create-account');
    await wrapper.vm.$nextTick();

    const modal = wrapper.findComponent({ name: 'AddAccountModal' });
    await modal.vm.$emit('save', {
      name: 'New Account',
      institutionId: 5,
      typeId: 2,
      statusId: 3,
    });
    await flushPromises();

    expect(mockPortfolioInstance.createAccount).toHaveBeenCalledWith(5, 'New Account', 2, 3);
    expect((wrapper.vm as unknown as AccountHubVm).modalOpen).toBe(false);
  });

  it('updates the account when editing and saving', async () => {
    const item = createAccountItem();
    mockPortfolioInstance.state.items = [item];
    mockPortfolioInstance.state.institutions = [sampleInstitution];

    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const tableComponent = wrapper.findComponent({ name: 'AccountHubTable' });
    await tableComponent.vm.$emit('edit-account', item.account);
    await wrapper.vm.$nextTick();

    const modal = wrapper.findComponent({ name: 'AddAccountModal' });
    await modal.vm.$emit('save', { name: 'Updated Name', institutionId: 0 });
    await flushPromises();

    expect(mockPortfolioInstance.updateAccount).toHaveBeenCalledWith(1, 'Updated Name');
  });

  it('creates an institution when stats trigger creation', async () => {
    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const statsComponent = wrapper.findComponent({ name: 'AccountHubStats' });
    await statsComponent.vm.$emit('create-institution');
    await wrapper.vm.$nextTick();

    const modal = wrapper.findComponent({ name: 'AddAccountModal' });
    await modal.vm.$emit('save', { name: 'New Bank', institutionId: 0 });
    await flushPromises();

    expect(mockPortfolioInstance.createInstitution).toHaveBeenCalledWith('New Bank');
  });

  it('confirms account deletion when confirm emitted', async () => {
    const item = createAccountItem();
    mockPortfolioInstance.state.items = [item];

    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const tableComponent = wrapper.findComponent({ name: 'AccountHubTable' });
    await tableComponent.vm.$emit('delete-item', 'account', item.account.id, item.account.name);
    await wrapper.vm.$nextTick();

    const deleteModal = wrapper.findComponent({ name: 'DeleteConfirmModal' });
    await deleteModal.vm.$emit('confirm');
    await flushPromises();

    expect(mockPortfolioInstance.deleteAccount).toHaveBeenCalledWith(item.account.id);
    expect((wrapper.vm as unknown as AccountHubVm).deleteConfirmOpen).toBe(false);
  });

  it('loads events into the events modal when table emits show-events', async () => {
    const item = createAccountItem();
    mockPortfolioInstance.state.items = [item];
    const eventsMock = vi.mocked(apiService.getAccountEvents);
    eventsMock.mockResolvedValue(sampleEvents);

    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const tableComponent = wrapper.findComponent({ name: 'AccountHubTable' });
    await tableComponent.vm.$emit('show-events', item.account.id, item.account.name, item.eventCount);
    await flushPromises();

    expect(eventsMock).toHaveBeenCalledWith(item.account.id);
    expect(wrapper.findAll('.event-row').length).toBe(sampleEvents.length);
    const vm = wrapper.vm as unknown as AccountHubVm;
    expect(vm.eventsModalOpen).toBe(true);
    expect(vm.eventsLoading).toBe(false);
  });

  it('resets events modal state when closing', async () => {
    const item = createAccountItem();
    mockPortfolioInstance.state.items = [item];
    const eventsMock = vi.mocked(apiService.getAccountEvents);
    eventsMock.mockResolvedValue(sampleEvents);

    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const tableComponent = wrapper.findComponent({ name: 'AccountHubTable' });
    await tableComponent.vm.$emit('show-events', item.account.id, item.account.name, item.eventCount);
    await flushPromises();

    await wrapper.find('.btn-close').trigger('click');
    await flushPromises();

    const vm = wrapper.vm as unknown as AccountHubVm;
    expect(vm.eventsModalOpen).toBe(false);
    expect(vm.events).toEqual([]);
    expect(vm.eventsError ?? null).toBeNull();
  });
});
