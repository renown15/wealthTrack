import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { reactive, ref } from 'vue';
import AccountHub from '@views/AccountHub/AccountHub.vue';
import type { PortfolioItem, Institution } from '@/models/WealthTrackDataModels';

type AccountHubVm = { accountModalOpen: boolean; institutionModalOpen: boolean };

const createMockPortfolio = () => {
  const state = reactive({
    items: [] as PortfolioItem[], institutions: [] as Institution[],
    error: null as string | null, loading: false, itemsLoading: false, institutionsLoading: false,
  });
  return {
    state,
    lastPriceUpdate: ref<string | null>(null),
    loadPortfolio: vi.fn(),
    clearError: vi.fn(),
    createAccount: vi.fn(),
  };
};

let mockPortfolioInstance = createMockPortfolio();

vi.mock('@/composables/usePortfolio', () => ({
  usePortfolio: () => mockPortfolioInstance,
}));

vi.mock('@/composables/useAccountGroups', () => ({
  useAccountGroups: () => ({
    state: reactive({ groups: [], groupMembers: new Map(), loading: false, error: null }),
    loadGroups: vi.fn(), createGroup: vi.fn(), updateGroup: vi.fn(), deleteGroup: vi.fn(),
    saveGroupMembers: vi.fn(), addAccountToGroup: vi.fn(), removeAccountFromGroup: vi.fn(),
  }),
}));

vi.mock('@/composables/useAccountCrudHandlers', () => ({
  useAccountCrudHandlers: () => ({
    accountTypes: ref([]),
    accountStatuses: ref([]),
    handleSave: vi.fn(async (p: any) => {
      await mockPortfolioInstance.createAccount(
        p.institutionId, p.name, p.typeId, p.statusId,
        p.accountNumber, p.sortCode, p.rollRefNumber,
        p.interestRate, p.fixedBonusRate, p.fixedBonusRateEndDate,
      );
    }),
    handleDelete: vi.fn(),
  }),
}));

vi.mock('@/composables/useInstitutionCrudHandlers', () => ({
  useInstitutionCrudHandlers: () => ({
    handleSave: vi.fn(async (p: any) => {
      await mockPortfolioInstance.createAccount(p.name, p.parentId || null);
    }),
    handleDelete: vi.fn(),
  }),
}));

vi.mock('@views/AccountHub/AccountHubStats.vue', () => ({
  default: {
    name: 'AccountHubStats',
    template: '<div data-testid="account-hub-stats"><slot /></div>',
    props: ['totalValue', 'accountCount'],
    emits: ['create-account', 'create-institution', 'create-account-group'],
  },
}));

vi.mock('@views/AccountHub/PortfolioTable.vue', () => ({
  default: {
    name: 'PortfolioTable',
    template: '<div data-testid="portfolio-table"><slot /></div>',
    props: ['items', 'groups', 'groupMembers', 'accountTypes', 'grouped', 'readOnly'],
    emits: ['edit-account', 'delete-account', 'edit-group', 'delete-group'],
  },
}));

vi.mock('@views/AccountHub/AccountHubModals.vue', () => ({
  default: {
    name: 'AccountHubModals',
    template: '<div data-testid="account-hub-modals"><slot /></div>',
    props: ['accountModalOpen', 'institutionModalOpen', 'modalType', 'editingItem'],
    emits: ['close-account', 'save-account', 'close-institution', 'save-institution', 'close-delete', 'confirm-delete'],
  },
}));

vi.mock('@views/AccountHub/PortfolioControls.vue', () => ({
  default: { name: 'PortfolioControls', template: '<div><slot /></div>', props: ['hideClosed', 'grouped', 'refreshing'] },
}));

vi.mock('@views/AccountHub/FamilyMemberTabs.vue', () => ({
  default: { name: 'FamilyMemberTabs', template: '<div><slot /></div>', props: ['members', 'activeId'] },
}));

vi.mock('@views/AccountHub/InstitutionsPanel.vue', () => ({
  default: { name: 'InstitutionsPanel', template: '<div><slot /></div>', props: ['institutions'] },
}));

vi.mock('@views/AccountHub/AccountDocumentsModal.vue', () => ({
  default: { name: 'AccountDocumentsModal', template: '<div><slot /></div>', props: ['open'] },
}));

vi.mock('@/services/ApiService', () => ({
  apiService: {
    getAccountEvents: vi.fn(),
    getReferenceData: vi.fn().mockResolvedValue([]),
    getFamilies: vi.fn().mockResolvedValue([]),
    refreshPrices: vi.fn().mockResolvedValue(undefined),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockPortfolioInstance = createMockPortfolio();
});

describe('AccountHub — modal interactions', () => {
  it('opens account modal when stats emits create-account', async () => {
    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();
    await wrapper.findComponent({ name: 'AccountHubStats' }).vm.$emit('create-account');
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as unknown as AccountHubVm).accountModalOpen).toBe(true);
  });

  it('opens institution modal when stats emits create-institution', async () => {
    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();
    await wrapper.findComponent({ name: 'AccountHubStats' }).vm.$emit('create-institution');
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as unknown as AccountHubVm).institutionModalOpen).toBe(true);
  });

  it('closes account modal when AccountHubModals emits close-account', async () => {
    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();
    await wrapper.findComponent({ name: 'AccountHubStats' }).vm.$emit('create-account');
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as unknown as AccountHubVm).accountModalOpen).toBe(true);
    await wrapper.findComponent({ name: 'AccountHubModals' }).vm.$emit('close-account');
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as unknown as AccountHubVm).accountModalOpen).toBe(false);
  });

  it('calls createAccount and closes modal when save-account emitted', async () => {
    const wrapper = mount(AccountHub);
    await wrapper.vm.$nextTick();
    await wrapper.findComponent({ name: 'AccountHubStats' }).vm.$emit('create-account');
    await wrapper.vm.$nextTick();
    await wrapper.findComponent({ name: 'AccountHubModals' }).vm.$emit('save-account', {
      name: 'New Account', institutionId: 5, typeId: 2, statusId: 3,
      accountNumber: undefined, sortCode: undefined, rollRefNumber: undefined,
      interestRate: undefined, fixedBonusRate: undefined, fixedBonusRateEndDate: undefined,
    });
    await flushPromises();
    expect(mockPortfolioInstance.createAccount).toHaveBeenCalledWith(
      5, 'New Account', 2, 3, undefined, undefined, undefined, undefined, undefined, undefined,
    );
    expect((wrapper.vm as unknown as AccountHubVm).accountModalOpen).toBe(false);
  });
});
