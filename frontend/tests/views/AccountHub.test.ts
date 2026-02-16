import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computed } from 'vue';
import { mount } from '@vue/test-utils';
import AccountHub from '@views/AccountHub/AccountHub.vue';
import * as usePortfolioModule from '@/composables/usePortfolio';
import type { PortfolioState } from '@/composables/usePortfolio';
import type { Account, AccountEvent, Institution, PortfolioItem } from '@/models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';

const mockGetReferenceData = vi.fn<[string], Promise<ReferenceDataItem[]>>();
const mockGetAccountEvents = vi.fn<[number], Promise<AccountEvent[]>>();

vi.mock('@/composables/usePortfolio');
vi.mock('@/services/ApiService', () => ({
  apiService: {
    getReferenceData: (...args: Parameters<typeof mockGetReferenceData>) => mockGetReferenceData(...args),
    getAccountEvents: (...args: Parameters<typeof mockGetAccountEvents>) => mockGetAccountEvents(...args),
  },
}));
vi.mock('@views/AccountHub/AccountHubStats.vue', () => ({
  default: { name: 'MockStats', template: '<div>stats</div>' },
}));
vi.mock('@views/AccountHub/AccountHubTable.vue', () => ({
  default: { name: 'MockTable', template: '<div>table</div>' },
}));
vi.mock('@views/AccountHub/AddAccountModal.vue', () => ({
  default: { name: 'MockModal', template: '<div>modal</div>' },
}));
vi.mock('@views/AccountHub/DeleteConfirmModal.vue', () => ({
  default: { name: 'MockDeleteModal', template: '<div>deletemodal</div>' },
}));
vi.mock('@views/AccountHub/InstitutionsList.vue', () => ({
  default: { name: 'MockList', template: '<div>list</div>' },
}));

const flushPromises = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

type PortfolioMock = ReturnType<typeof usePortfolioModule.usePortfolio>;
type PortfolioMockOverrides = Partial<Omit<PortfolioMock, 'state'>> & {
  state?: Partial<PortfolioState>;
};

const createUsePortfolioMock = (overrides: PortfolioMockOverrides = {}): PortfolioMock => {
  const state: PortfolioState = {
    loading: false,
    error: null,
    items: [],
    institutions: [],
    ...(overrides.state ?? {}),
  };

  const base: PortfolioMock = {
    state,
    totalValue: computed(() => 0),
    accountCount: computed(() => state.items.length),
    institutionCount: computed(() => state.institutions.length),
    eventCount: computed(() => 0),
    cashAtHand: computed(() => 0),
    isaSavings: computed(() => 0),
    illiquid: computed(() => 0),
    trustAssets: computed(() => 0),
    loadPortfolio: vi.fn<[], Promise<void>>(),
    createAccount: vi.fn<[number, string, number?, number?], Promise<void>>(),
    updateAccount: vi.fn<[number, string], Promise<void>>(),
    deleteAccount: vi.fn<[number], Promise<void>>(),
    createInstitution: vi.fn<[string], Promise<void>>(),
    updateInstitution: vi.fn<[number, string], Promise<void>>(),
    deleteInstitution: vi.fn<[number], Promise<void>>(),
    clearError: vi.fn<[], void>(),
  };

  const { state: _state, ...rest } = overrides;

  return {
    ...base,
    ...rest,
    state,
  };
};

const mountAccountHub = async (portfolioMock?: PortfolioMock) => {
  const mockInstance = portfolioMock ?? createUsePortfolioMock();
  vi.mocked(usePortfolioModule.usePortfolio).mockImplementation(() => mockInstance);
  const wrapper = mount(AccountHub);
  await flushPromises();
  return { wrapper, portfolioMock: mockInstance };
};

const getAccountHubVm = (wrapper: ReturnType<typeof mount>) => wrapper.vm as unknown as AccountHubVm;

type AccountHubVm = {
  accountModalOpen: boolean;
  institutionModalOpen: boolean;
  modalType: 'create' | 'edit';
  eventsModalOpen: boolean;
  eventsLoading: boolean;
  events: AccountEvent[];
  eventsError?: string;
  eventsTitle: string;
  deleteConfirmOpen: boolean;
  deleteConfirmName: string;
  openDeleteConfirm: (type: 'account' | 'institution', id: number, name: string) => void;
  handleConfirmDelete: () => Promise<void>;
  closeDeleteConfirm: () => void;
  openEventsModal: (accountId: number, accountName: string, eventCount: number) => Promise<void>;
  closeEventsModal: () => void;
};

describe('AccountHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetReferenceData.mockResolvedValue([]);
    mockGetAccountEvents.mockResolvedValue([]);
  });

  it('renders loading state initially', async () => {
    const { wrapper } = await mountAccountHub(
      createUsePortfolioMock({ state: { loading: true } }),
    );

    expect(wrapper.text()).toContain('Loading portfolio');
  });

  it('renders empty state when no accounts', async () => {
    const { wrapper } = await mountAccountHub();

    expect(wrapper.text()).toContain('No accounts yet');
    expect(wrapper.text()).toContain('Create your first account');
  });

  it('emits createAccount from stats', async () => {
    const { wrapper } = await mountAccountHub();
    const statsComponent = wrapper.findComponent({ name: 'MockStats' });

    await statsComponent.vm.$emit('create-account');
    await wrapper.vm.$nextTick();

    const vm = getAccountHubVm(wrapper);
    expect(vm.accountModalOpen).toBe(true);
    expect(vm.modalType).toBe('create');
  });

  it('loads events into the modal and closes it', async () => {
    const sampleEvents: AccountEvent[] = [
      {
        id: 1,
        accountId: 10,
        userId: 4,
        eventType: 'created',
        value: 'Sample',
        createdAt: '2026-02-10T00:00:00Z',
        updatedAt: '2026-02-10T00:00:00Z',
      },
    ];
    mockGetAccountEvents.mockResolvedValue(sampleEvents);

    const { wrapper } = await mountAccountHub();
    const vm = getAccountHubVm(wrapper);

    await vm.openEventsModal(10, 'Savings', 2);
    await flushPromises();

    expect(mockGetAccountEvents).toHaveBeenCalledWith(10);
    expect(vm.eventsModalOpen).toBe(true);
    expect(vm.eventsLoading).toBe(false);
    expect(vm.events).toEqual(sampleEvents);
    expect(vm.eventsTitle).toContain('Savings');

    vm.closeEventsModal();
    expect(vm.eventsModalOpen).toBe(false);
    expect(vm.events).toEqual([]);
    expect(vm.eventsError).toBeUndefined();
  });
});
