import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref, computed } from 'vue';

const institutionsData = [
  { id: 1, userId: 1, name: 'Barclays', institutionType: 'Bank', createdAt: '', updatedAt: '' },
  { id: 2, userId: 1, name: 'British Gas', institutionType: 'Utility Provider', createdAt: '', updatedAt: '' },
];

const mockGetInstitutions = vi.fn();
const mockCreateInstitution = vi.fn();
vi.mock('@services/ApiService', () => ({
  apiService: {
    getInstitutions: () => mockGetInstitutions(),
    createInstitution: (d: unknown) => mockCreateInstitution(d),
  },
}));
vi.mock('@composables/useOutgoings', () => ({
  useOutgoings: () => ({
    outgoingItems: computed(() => []),
    stats: computed(() => ({ totalMonthlyGbp: 0, totalAnnualGbp: 0, renewingSoonCount: 0, byCategory: [] })),
    loading: ref(false), error: ref(null),
    loadPortfolio: vi.fn().mockResolvedValue(undefined),
    createAccount: vi.fn(), updateAccount: vi.fn(), deleteAccount: vi.fn(),
  }),
}));
vi.mock('@composables/useHubReferenceData', () => ({
  useHubReferenceData: () => ({
    accountTypes: ref([{ id: 1, referenceValue: 'Utility - Gas' }]),
    accountStatuses: ref([]),
    institutionTypes: ref([]),
    credentialTypes: ref([]),
  }),
}));
vi.mock('@composables/outgoingTypes', () => ({
  useOutgoingTypes: () => ({
    outgoingAccountTypes: ref([{ id: 1, referenceValue: 'Utility - Gas' }]),
    outgoingInstitutionTypes: ref([
      { id: 2, referenceValue: 'Utility Provider' },
      { id: 3, referenceValue: 'Insurer' },
    ]),
  }),
  isOutgoingInstitution: (t: string | null | undefined) =>
    ['Utility Provider', 'Insurer', 'Subscription Service'].includes(t ?? ''),
  loadOutgoingTypes: vi.fn().mockResolvedValue(undefined),
}));
const showSuccess = vi.fn();
const showError = vi.fn();
vi.mock('@composables/useToast', () => ({ useToast: () => ({ showSuccess, showError }) }));

import OutgoingsHub from '@/views/OutgoingsHub/OutgoingsHub.vue';
import AccountModal from '@views/AccountHub/AccountModal.vue';
import InstitutionModal from '@views/AccountHub/InstitutionModal.vue';
import OutgoingsHubStats from '@views/OutgoingsHub/OutgoingsHubStats.vue';

const mountHub = () =>
  mount(OutgoingsHub, {
    global: { stubs: { OutgoingsTable: true, AccountDocumentsModal: true, DeleteConfirmModal: true } },
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockGetInstitutions.mockResolvedValue(institutionsData);
  mockCreateInstitution.mockResolvedValue({ id: 3 });
});

describe('OutgoingsHub — providers', () => {
  it('offers only Outgoings-provider institutions in the account dropdown', async () => {
    const wrapper = mountHub();
    await flushPromises();
    const provided = wrapper.findComponent(AccountModal).props('institutions') as { name: string }[];
    expect(provided.map((i) => i.name)).toEqual(['British Gas']); // Barclays (Bank) excluded
  });

  it('restricts the provider modal to Outgoings institution types', async () => {
    const wrapper = mountHub();
    await flushPromises();
    await wrapper.findComponent(OutgoingsHubStats).vm.$emit('addProvider');
    const modal = wrapper.findComponent(InstitutionModal);
    expect(modal.props('open')).toBe(true);
    const types = modal.props('institutionTypes') as { referenceValue: string }[];
    expect(types.map((t) => t.referenceValue)).toEqual(['Utility Provider', 'Insurer']); // no Bank
  });

  it('creates a provider and reloads institutions on save', async () => {
    const wrapper = mountHub();
    await flushPromises();
    mockGetInstitutions.mockClear();
    await wrapper.findComponent(InstitutionModal).vm.$emit('save', {
      name: 'Netflix', institutionId: 0, parentId: null, institutionType: 'Subscription Service',
    });
    await flushPromises();
    expect(mockCreateInstitution).toHaveBeenCalledWith({
      name: 'Netflix', parentId: null, institutionType: 'Subscription Service',
    });
    expect(mockGetInstitutions).toHaveBeenCalled(); // reloaded
    expect(showSuccess).toHaveBeenCalledWith('Provider added');
  });
});
