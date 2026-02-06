/**
 * Tests for PortfolioView - Error handling in save/delete operations
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

describe('PortfolioView - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePortfolio.mockReturnValue(createMockPortfolioReturn());
  });

  it('should handle createAccount validation error', async () => {
    const mockCreateAccount = vi.fn();
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { createAccount: mockCreateAccount })
    );

    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    vm.modalResourceType = 'account';
    vm.modalType = 'create';
    vm.formData = { name: '', institutionId: 0 };

    await vm.handleSave();

    expect(mockCreateAccount).not.toHaveBeenCalled();
    expect(vm.state.error).toContain('required fields');
  });

  it('should handle createInstitution validation error', async () => {
    const mockCreateInst = vi.fn();
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { createInstitution: mockCreateInst })
    );

    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    vm.modalResourceType = 'institution';
    vm.modalType = 'create';
    vm.formData = { name: '', institutionId: 0 };

    await vm.handleSave();

    expect(mockCreateInst).not.toHaveBeenCalled();
    expect(vm.state.error).toContain('Institution name');
  });

  it('should catch error in handleSave for createAccount', async () => {
    const mockCreateAccount = vi.fn().mockRejectedValue(new Error('Network error'));
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { createAccount: mockCreateAccount })
    );

    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    vm.modalResourceType = 'account';
    vm.modalType = 'create';
    vm.formData = { name: 'Test', institutionId: 1 };

    await vm.handleSave();
    // Test passes if no error is thrown during error handling
    expect(vm).toBeDefined();
  });

  it('should catch error in handleConfirmDelete', async () => {
    const mockDeleteAccount = vi.fn().mockRejectedValue(new Error('Delete failed'));
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { deleteAccount: mockDeleteAccount })
    );

    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    vm.deleteConfirmType = 'account';
    vm.deleteConfirmId = 1;

    await vm.handleConfirmDelete();

    expect(mockDeleteAccount).toHaveBeenCalled();
  });

  it('should handle error in deleteInstitution', async () => {
    const mockDeleteInstitution = vi.fn().mockRejectedValue(new Error('Delete failed'));
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { deleteInstitution: mockDeleteInstitution })
    );

    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    vm.deleteConfirmType = 'institution';
    vm.deleteConfirmId = 1;

    await vm.handleConfirmDelete();

    expect(mockDeleteInstitution).toHaveBeenCalled();
  });

  it('should reject invalid institution edit submit without name', async () => {
    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    vm.modalResourceType = 'institution';
    vm.modalType = 'edit';
    vm.modalOpen = true;
    vm.editingItem = { id: 1, name: 'Bank' };
    vm.formData = { name: '', institutionId: 0 };

    await vm.handleSave();

    expect(vm.state.error).toBe('Institution name is required');
    expect(vm.modalOpen).toBe(true);
  });
});
