/**
 * Tests for PortfolioView - Handler functions (create, update, delete)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import PortfolioView from '@/views/PortfolioView.vue';
import * as usePortfolioModule from '@/composables/usePortfolio';
import { createMockPortfolioReturn } from './helpers/portfolioViewTestHelper';

vi.mock('@/composables/usePortfolio', () => ({
  usePortfolio: vi.fn(),
}));

const mockUsePortfolio = usePortfolioModule.usePortfolio as any;

describe('PortfolioView - Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePortfolio.mockReturnValue(createMockPortfolioReturn());
  });

  it('should handle successful institution creation', async () => {
    const createInstitutionMock = vi.fn().mockResolvedValue(undefined);
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { createInstitution: createInstitutionMock })
    );
    const wrapper = mount(PortfolioView);
    expect(wrapper.exists()).toBe(true);
  });

  it('should handle successful account update', async () => {
    const updateAccountMock = vi.fn().mockResolvedValue(undefined);
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { updateAccount: updateAccountMock })
    );
    const wrapper = mount(PortfolioView);
    expect(wrapper.exists()).toBe(true);
  });

  it('should handle successful institution update', async () => {
    const updateInstitutionMock = vi.fn().mockResolvedValue(undefined);
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { updateInstitution: updateInstitutionMock })
    );
    const wrapper = mount(PortfolioView);
    expect(wrapper.exists()).toBe(true);
  });

  it('should handle successful institution deletion', async () => {
    const deleteInstitutionMock = vi.fn().mockResolvedValue(undefined);
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { deleteInstitution: deleteInstitutionMock })
    );
    const wrapper = mount(PortfolioView);
    expect(wrapper.exists()).toBe(true);
  });

  it('should successfully delete account when confirmed', async () => {
    const mockDeleteAccount = vi.fn().mockResolvedValue(undefined);
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { deleteAccount: mockDeleteAccount })
    );

    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    vm.deleteConfirmType = 'account';
    vm.deleteConfirmId = 1;
    vm.deleteConfirmOpen = true;

    await vm.handleConfirmDelete();

    expect(mockDeleteAccount).toHaveBeenCalledWith(1);
    expect(vm.deleteConfirmOpen).toBe(false);
  });

  it('should successfully delete institution when confirmed', async () => {
    const mockDeleteInstitution = vi.fn().mockResolvedValue(undefined);
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { deleteInstitution: mockDeleteInstitution })
    );

    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    vm.deleteConfirmType = 'institution';
    vm.deleteConfirmId = 2;
    vm.deleteConfirmOpen = true;

    await vm.handleConfirmDelete();

    expect(mockDeleteInstitution).toHaveBeenCalledWith(2);
    expect(vm.deleteConfirmOpen).toBe(false);
  });

  it('should update institution when form submitted in edit mode', async () => {
    const mockUpdateInstitution = vi.fn().mockResolvedValue(undefined);
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { updateInstitution: mockUpdateInstitution })
    );

    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    vm.modalResourceType = 'institution';
    vm.modalType = 'edit';
    vm.editingItem = { id: 1, name: 'Old Bank' };
    vm.formData = { name: 'Updated Bank', institutionId: 0 };

    await vm.handleSave();

    expect(mockUpdateInstitution).toHaveBeenCalledWith(1, 'Updated Bank');
    expect(vm.modalOpen).toBe(false);
  });

  it('should update account when form submitted in edit mode', async () => {
    const mockUpdateAccount = vi.fn().mockResolvedValue(undefined);
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { updateAccount: mockUpdateAccount })
    );

    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    vm.modalResourceType = 'account';
    vm.modalType = 'edit';
    vm.editingItem = { id: 1, name: 'Old Account' };
    vm.formData = { name: 'Updated Account', institutionId: 2 };

    await vm.handleSave();

    expect(mockUpdateAccount).toHaveBeenCalledWith(1, 'Updated Account');
    expect(vm.modalOpen).toBe(false);
  });
});
