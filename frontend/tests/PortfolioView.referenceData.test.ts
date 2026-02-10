/**
 * Focused tests for PortfolioView reference data flows and institution modals.
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { mount } from '@vue/test-utils';
import PortfolioView from '@/views/PortfolioView.vue';
import * as usePortfolioModule from '@/composables/usePortfolio';
import { createMockPortfolioReturn, createMockInstitution } from './helpers/portfolioViewTestHelper';
import { apiService } from '@/services/ApiService';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    getReferenceData: vi.fn().mockResolvedValue([]),
  },
}));

const mockGetReferenceData = vi.mocked(apiService).getReferenceData as Mock;

vi.mock('@/composables/usePortfolio', () => ({
  usePortfolio: vi.fn(),
}));

const mockUsePortfolio = usePortfolioModule.usePortfolio as any;
let portfolioReturn: ReturnType<typeof createMockPortfolioReturn>;

describe('PortfolioView reference data helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    portfolioReturn = createMockPortfolioReturn();
    mockUsePortfolio.mockReturnValue(portfolioReturn);
    mockGetReferenceData.mockResolvedValue([]);
  });

  it('loads reference data into dropdowns', async () => {
    const accountTypes = [{ id: 5, referenceValue: 'Savings' }];
    const accountStatuses = [{ id: 6, referenceValue: 'Active' }];

    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    mockGetReferenceData
      .mockReset()
      .mockResolvedValueOnce(accountTypes)
      .mockResolvedValueOnce(accountStatuses);

    await vm.loadReferenceData();

    expect(vm.accountTypes).toEqual(accountTypes);
    expect(vm.accountStatuses).toEqual(accountStatuses);
  });

  it('applies reference defaults when account modal is open', () => {
    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    vm.modalOpen = true;
    vm.modalResourceType = 'account';
    vm.accountTypes = [{ id: 77, referenceValue: 'Savings' }];
    vm.accountStatuses = [{ id: 88, referenceValue: 'Active' }];
    vm.formData = { name: '', institutionId: 0, typeId: 0, statusId: 0 };

    vm.applyReferenceDefaults();

    expect(vm.formData.typeId).toBe(77);
    expect(vm.formData.statusId).toBe(88);
  });

  it('opens the institution creation modal', () => {
    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    vm.openCreateInstitutionModal();

    expect(vm.modalResourceType).toBe('institution');
    expect(vm.modalType).toBe('create');
    expect(vm.modalOpen).toBe(true);
  });

  it('prepares editing state for institutions', () => {
    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    const institution = createMockInstitution({ id: 99, name: 'Bank Nova' });

    vm.openEditInstitutionModal(institution);

    expect(vm.editingItem).toEqual(institution);
    expect(vm.modalResourceType).toBe('institution');
    expect(vm.modalType).toBe('edit');
    expect(vm.modalOpen).toBe(true);
    expect(vm.formData.name).toBe('Bank Nova');
  });

  it('updates institution when handleSave runs in edit mode', async () => {
    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    const institution = createMockInstitution({ id: 55, name: 'Original' });

    vm.modalResourceType = 'institution';
    vm.modalType = 'edit';
    vm.editingItem = institution;
    vm.formData = {
      name: 'Updated Institution',
      institutionId: 0,
      typeId: 0,
      statusId: 0,
    };

    await vm.handleSave();

    expect(portfolioReturn.updateInstitution).toHaveBeenCalledWith(55, 'Updated Institution');
    expect(vm.modalOpen).toBe(false);
  });
});
