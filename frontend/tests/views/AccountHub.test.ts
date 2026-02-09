import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { computed } from 'vue';
import AccountHub from '@views/AccountHub/AccountHub.vue';
import * as usePortfolioModule from '@/composables/usePortfolio';

vi.mock('@/composables/usePortfolio');
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

describe('AccountHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    const mockUsePortfolio = vi.fn(() => ({
      state: { loading: true, error: null, items: [], institutions: [] },
      totalValue: computed(() => 0),
      accountCount: computed(() => 0),
      loadPortfolio: vi.fn(),
      createAccount: vi.fn(),
      updateAccount: vi.fn(),
      deleteAccount: vi.fn(),
      createInstitution: vi.fn(),
      updateInstitution: vi.fn(),
      deleteInstitution: vi.fn(),
      clearError: vi.fn(),
    }));
    vi.mocked(usePortfolioModule.usePortfolio).mockImplementation(mockUsePortfolio);

    const wrapper = mount(AccountHub);
    expect(wrapper.text()).toContain('Loading portfolio');
  });

  it('renders empty state when no accounts', () => {
    const mockUsePortfolio = vi.fn(() => ({
      state: { loading: false, error: null, items: [], institutions: [] },
      totalValue: computed(() => 0),
      accountCount: computed(() => 0),
      loadPortfolio: vi.fn(),
      createAccount: vi.fn(),
      updateAccount: vi.fn(),
      deleteAccount: vi.fn(),
      createInstitution: vi.fn(),
      updateInstitution: vi.fn(),
      deleteInstitution: vi.fn(),
      clearError: vi.fn(),
    }));
    vi.mocked(usePortfolioModule.usePortfolio).mockImplementation(mockUsePortfolio);

    const wrapper = mount(AccountHub);
    expect(wrapper.text()).toContain('No accounts yet');
    expect(wrapper.text()).toContain('Create your first account');
  });

  it('displays error banner when error exists', () => {
    const clearErrorMock = vi.fn();
    const mockUsePortfolio = vi.fn(() => ({
      state: { loading: false, error: 'Test error message', items: [], institutions: [] },
      totalValue: computed(() => 0),
      accountCount: computed(() => 0),
      loadPortfolio: vi.fn(),
      createAccount: vi.fn(),
      updateAccount: vi.fn(),
      deleteAccount: vi.fn(),
      createInstitution: vi.fn(),
      updateInstitution: vi.fn(),
      deleteInstitution: vi.fn(),
      clearError: clearErrorMock,
    }));
    vi.mocked(usePortfolioModule.usePortfolio).mockImplementation(mockUsePortfolio);

    const wrapper = mount(AccountHub);
    expect(wrapper.text()).toContain('Test error message');

    const closeBtn = wrapper.find('.error-banner button');
    closeBtn.trigger('click');
    expect(clearErrorMock).toHaveBeenCalled();
  });

  it('emits createAccount from stats', async () => {
    const mockUsePortfolio = vi.fn(() => ({
      state: { loading: false, error: null, items: [], institutions: [] },
      totalValue: computed(() => 0),
      accountCount: computed(() => 0),
      loadPortfolio: vi.fn(),
      createAccount: vi.fn(),
      updateAccount: vi.fn(),
      deleteAccount: vi.fn(),
      createInstitution: vi.fn(),
      updateInstitution: vi.fn(),
      deleteInstitution: vi.fn(),
      clearError: vi.fn(),
    }));
    vi.mocked(usePortfolioModule.usePortfolio).mockImplementation(mockUsePortfolio);

    const wrapper = mount(AccountHub);
    // Trigger the stats component's createAccount event
    const statsComponent = wrapper.findComponent({ name: 'MockStats' });
    await statsComponent.vm.$emit('create-account');
    await wrapper.vm.$nextTick();

    // Modal should be visible - use type assertion for internal state
    const vm = wrapper.vm as unknown as { modalOpen: boolean; modalType: string; modalResourceType: string };
    expect(vm.modalOpen).toBe(true);
    expect(vm.modalType).toBe('create');
    expect(vm.modalResourceType).toBe('account');
  });
});
