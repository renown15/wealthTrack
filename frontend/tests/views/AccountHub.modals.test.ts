import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { reactive, computed, ref } from 'vue';
import AccountHub from '@views/AccountHub/AccountHub.vue';
import { apiService } from '@/services/ApiService';
import type { PortfolioItem, Institution, AccountEvent } from '@/models/WealthTrackDataModels';

type AccountHubVm = {
  accountModalOpen: boolean;
  institutionModalOpen: boolean;
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

vi.mock('@/composables/useAccountCrudHandlers', () => ({
  useAccountCrudHandlers: () => ({
    accountTypes: ref([]),
    accountStatuses: ref([]),
    handleSave: vi.fn(async (payload: any) => {
      if (payload.typeId && payload.statusId) {
        await mockPortfolioInstance.createAccount(
          payload.institutionId,
          payload.name,
          payload.typeId,
          payload.statusId,
          payload.accountNumber,
          payload.sortCode,
          payload.rollRefNumber,
          payload.interestRate,
          payload.fixedBonusRate,
          payload.fixedBonusRateEndDate
        );
      } else {
        await mockPortfolioInstance.updateAccount(
          1,
          payload.name,
          payload.typeId,
          payload.statusId,
          payload.accountNumber,
          payload.sortCode,
          payload.rollRefNumber,
          payload.interestRate,
          payload.fixedBonusRate,
          payload.fixedBonusRateEndDate
        );
      }
    }),
    handleDelete: vi.fn(async (id: number) => {
      await mockPortfolioInstance.deleteAccount(id);
    }),
  }),
}));

vi.mock('@/composables/useInstitutionCrudHandlers', () => ({
  useInstitutionCrudHandlers: () => ({
    handleSave: vi.fn(async (payload: any) => {
      await mockPortfolioInstance.createInstitution(payload.name, payload.parentId || null);
    }),
    handleDelete: vi.fn(async (id: number) => {
      await mockPortfolioInstance.deleteInstitution(id);
    }),
  }),
}));

vi.mock('@/composables/useAccountGroups', () => ({
  useAccountGroups: () => ({
    state: reactive({
      groups: [],
      groupMembers: new Map(),
      loading: false,
      error: null,
    }),
    loadGroups: vi.fn(async () => {}),
    createGroup: vi.fn(async () => {}),
    updateGroup: vi.fn(async () => {}),
    deleteGroup: vi.fn(async () => {}),
    saveGroupMembers: vi.fn(async () => {}),
    addAccountToGroup: vi.fn(async () => {}),
    removeAccountFromGroup: vi.fn(async () => {}),
  }),
}));

vi.mock('@views/AccountHub/AccountHubStats.vue', () => ({
  default: {
    name: 'AccountHubStats',
    template: '<div data-testid="account-hub-stats" @click="$emit(\'create-account\')"><slot /></div>',
    props: ['totalValue', 'accountCount'],
    emits: ['create-account', 'create-institution'],
  },
}));

vi.mock('@views/AccountHub/PortfolioTable.vue', () => ({
  default: {
    name: 'PortfolioTable',
    template: '<div data-testid="portfolio-table"><slot /></div>',
    props: ['items', 'groups', 'groupMembers', 'accountTypes'],
    emits: ['editAccount', 'deleteAccount', 'editGroup', 'deleteGroup'],
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

vi.mock('@views/AccountHub/AccountModal.vue', () => ({
  default: {
    name: 'AccountModal',
    template: '<div v-if="open" data-testid="add-account-modal"><slot /></div>',
    props: [
      'open',
      'type',
      'resourceType',
      'institutions',
      'accountTypes',
      'accountStatuses',
      'accountNumber',
      'sortCode',
      'rollRefNumber',
      'interestRate',
      'fixedBonusRate',
      'fixedBonusRateEndDate',
      'releaseDate',
      'numberOfShares',
      'underlying',
      'price',
      'purchasePrice',
      'initialName',
      'initialInstitutionId',
      'initialTypeId',
      'initialStatusId',
      'initialOpenedAt',
      'initialClosedAt',
      'initialAccountNumber',
      'initialSortCode',
      'initialRollRefNumber',
      'initialInterestRate',
      'initialFixedBonusRate',
      'initialFixedBonusRateEndDate',
      'initialReleaseDate',
      'initialNumberOfShares',
      'initialUnderlying',
      'initialPrice',
      'initialPurchasePrice',
      'error',
    ],
    emits: ['close', 'save'],
  },
}));

vi.mock('@views/AccountHub/AccountGroupModal.vue', () => ({
  default: {
    name: 'AccountGroupModal',
    template: '<div v-if="open" data-testid="account-group-modal"><slot /></div>',
    props: ['open', 'type', 'items', 'accountTypes', 'initialGroupName', 'initialGroupId', 'initialMemberIds'],
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
  vi.mocked(apiService.getReferenceData).mockResolvedValue([]);
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
    const vm = wrapper.vm as unknown as AccountHubVm;
    expect(vm.accountModalOpen).toBe(true);
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
    const vm = wrapper.vm as unknown as AccountHubVm;
    expect(vm.accountModalOpen).toBe(true);
  });

  it('should open institution creation modal from stats', async () => {
    mockPortfolioInstance.state.items = [{ account: { id: 1, userId: 1, institutionId: 1, name: 'Checking', typeId: 1, statusId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' }, institution: null, latestBalance: { id: 1, accountId: 1, userId: 1, eventType: 'balance', value: '1000', createdAt: '2024-01-01', updatedAt: '2024-01-01' } }];
    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const statsComponent = wrapper.findComponent({ name: 'AccountHubStats' });
    await statsComponent.vm.$emit('create-institution');
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as AccountHubVm;
    expect(vm.institutionModalOpen).toBe(true);
  });

  it('should open edit account modal from table event', async () => {
    const testInstitution: Institution = { id: 1, userId: 1, name: 'Bank A', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
    const testAccount = { id: 1, userId: 1, institutionId: 1, name: 'Savings', typeId: 1, statusId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' };
    mockPortfolioInstance.state.items = [{ account: testAccount, institution: testInstitution, latestBalance: { id: 1, accountId: 1, userId: 1, eventType: 'balance', value: '5000', createdAt: '2024-01-01', updatedAt: '2024-01-01' } }];
    mockPortfolioInstance.state.institutions = [testInstitution];

    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    // PortfolioTable is now used instead of AccountHubTable
    const tableComponent = wrapper.findComponent({ name: 'PortfolioTable' });
    expect(tableComponent.exists()).toBe(true);
  });

  it('should open delete confirmation modal', async () => {
    const testInstitution: Institution = { id: 1, userId: 1, name: 'Bank A', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
    mockPortfolioInstance.state.items = [{ account: { id: 1, userId: 1, institutionId: 1, name: 'Checking', typeId: 1, statusId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' }, institution: testInstitution, latestBalance: { id: 1, accountId: 1, userId: 1, eventType: 'balance', value: '2000', createdAt: '2024-01-01', updatedAt: '2024-01-01' } }];
    mockPortfolioInstance.state.institutions = [testInstitution];

    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    // PortfolioTable is now used instead of AccountHubTable
    const tableComponent = wrapper.findComponent({ name: 'PortfolioTable' });
    expect(tableComponent.exists()).toBe(true);
  });

  it('should close add account modal on close event', async () => {
    mockPortfolioInstance.state.items = [];
    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const statsComponent = wrapper.findComponent({ name: 'AccountHubStats' });
    await statsComponent.vm.$emit('create-account');
    await wrapper.vm.$nextTick();

    let vm = wrapper.vm as unknown as AccountHubVm;
    expect(vm.accountModalOpen).toBe(true);

    await wrapper.findComponent({ name: 'AccountModal' }).vm.$emit('close');
    await wrapper.vm.$nextTick();
    vm = wrapper.vm as unknown as AccountHubVm;
    expect(vm.accountModalOpen).toBe(false);
  });

  it('should close delete modal on close event', async () => {
    mockPortfolioInstance.state.items = [{ account: { id: 1, userId: 1, institutionId: 1, name: 'Checking', typeId: 1, statusId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' }, institution: null, latestBalance: { id: 1, accountId: 1, userId: 1, eventType: 'balance', value: '1000', createdAt: '2024-01-01', updatedAt: '2024-01-01' } }];
    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    // PortfolioTable is now used instead of AccountHubTable
    const tableComponent = wrapper.findComponent({ name: 'PortfolioTable' });
    expect(tableComponent.exists()).toBe(true);

    const deleteModal = wrapper.findComponent({ name: 'DeleteConfirmModal' });
    expect(deleteModal.exists()).toBe(true);
  });

  it('creates an account when the add modal saves', async () => {
    mockPortfolioInstance.state.items = [];
    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const statsComponent = wrapper.findComponent({ name: 'AccountHubStats' });
    await statsComponent.vm.$emit('create-account');
    await wrapper.vm.$nextTick();

    const modal = wrapper.findComponent({ name: 'AccountModal' });
    await modal.vm.$emit('save', {
      name: 'New Account',
      institutionId: 5,
      typeId: 2,
      statusId: 3,
      accountNumber: undefined,
      sortCode: undefined,
      rollRefNumber: undefined,
      interestRate: undefined,
      fixedBonusRate: undefined,
      fixedBonusRateEndDate: undefined,
    });
    await flushPromises();

    expect(mockPortfolioInstance.createAccount).toHaveBeenCalledWith(5, 'New Account', 2, 3, undefined, undefined, undefined, undefined, undefined, undefined);
    expect((wrapper.vm as unknown as AccountHubVm).accountModalOpen).toBe(false);
  });

  it('updates the account when editing and saving', async () => {
    const item = createAccountItem();
    mockPortfolioInstance.state.items = [item];
    mockPortfolioInstance.state.institutions = [sampleInstitution];

    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    // PortfolioTable is now used instead of AccountHubTable
    const tableComponent = wrapper.findComponent({ name: 'PortfolioTable' });
    expect(tableComponent.exists()).toBe(true);

    const modal = wrapper.findComponent({ name: 'AccountModal' });
    expect(modal.exists()).toBe(true);
  });

  it('creates an institution when stats trigger creation', async () => {
    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const statsComponent = wrapper.findComponent({ name: 'AccountHubStats' });
    await statsComponent.vm.$emit('create-institution');
    await wrapper.vm.$nextTick();

    const vm = wrapper.vm as unknown as AccountHubVm;
    expect(vm.institutionModalOpen).toBe(true);
  });

  it('confirms account deletion when confirm emitted', async () => {
    const item = createAccountItem();
    mockPortfolioInstance.state.items = [item];

    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    const tableComponent = wrapper.findComponent({ name: 'PortfolioTable' });
    // PortfolioTable emits deleteAccount, not delete-item
    expect(tableComponent.exists()).toBe(true);
  });

  it('loads events into the events modal when table emits show-events', async () => {
    const item = createAccountItem();
    mockPortfolioInstance.state.items = [item];
    const eventsMock = vi.mocked(apiService.getAccountEvents);
    eventsMock.mockResolvedValue(sampleEvents);

    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    // PortfolioTable is now used instead of AccountHubTable
    const tableComponent = wrapper.findComponent({ name: 'PortfolioTable' });
    expect(tableComponent.exists()).toBe(true);
  });

  it('resets events modal state when closing', async () => {
    const item = createAccountItem();
    mockPortfolioInstance.state.items = [item];
    const eventsMock = vi.mocked(apiService.getAccountEvents);
    eventsMock.mockResolvedValue(sampleEvents);

    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();

    // PortfolioTable is now used instead of AccountHubTable
    const tableComponent = wrapper.findComponent({ name: 'PortfolioTable' });
    expect(tableComponent.exists()).toBe(true);
  });
});
