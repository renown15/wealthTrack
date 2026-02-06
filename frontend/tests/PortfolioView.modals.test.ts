/**
 * Tests for PortfolioView - Modal and form interactions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Account } from '@/models/Portfolio';
import PortfolioView from '@/views/PortfolioView.vue';
import * as usePortfolioModule from '@/composables/usePortfolio';
import { createMockPortfolioReturn, createMockInstitution } from './helpers/portfolioViewTestHelper';

vi.mock('@/composables/usePortfolio', () => ({
  usePortfolio: vi.fn(),
}));

const mockUsePortfolio = usePortfolioModule.usePortfolio as any;

describe('PortfolioView - Modal Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePortfolio.mockReturnValue(createMockPortfolioReturn());
  });

  it('should properly open and close delete confirmation', async () => {
    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    expect(vm.deleteConfirmOpen).toBe(false);

    vm.openDeleteConfirm('account', 1, 'Test Account');
    expect(vm.deleteConfirmOpen).toBe(true);
    expect(vm.deleteConfirmId).toBe(1);

    vm.closeDeleteConfirm();
    expect(vm.deleteConfirmOpen).toBe(false);
  });

  it('should clear form data when closing modal', async () => {
    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    vm.formData = { name: 'Test', institutionId: 1 };
    vm.modalOpen = true;

    vm.closeModal();

    expect(vm.modalOpen).toBe(false);
    expect(vm.formData.name).toBe('');
    expect(vm.formData.institutionid).toBe(0);
    expect(vm.editingItem).toBeNull();
  });

  it('should handle currency formatting with undefined values', () => {
    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    expect(vm.formatCurrency(undefined)).toBe('$0.00');
    expect(vm.formatCurrency(null)).toBe('$0.00');
    expect(vm.formatCurrency(0)).toBe('$0.00');
    expect(vm.formatCurrency('1500.50')).toContain('1,500.50');
    expect(vm.formatCurrency(1500.5)).toContain('1,500.50');
  });

  it('should handle currency formatting errors gracefully', () => {
    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    const result = vm.formatCurrency('invalid');
    expect(result).toContain('NaN');
  });

  it('should format date properly', () => {
    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    const result = vm.formatDate('2026-02-04');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('should properly open edit institution modal', async () => {
    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    const institution = { id: 1, name: 'Test Bank' };

    vm.openEditInstitutionModal(institution);

    expect(vm.modalResourceType).toBe('institution');
    expect(vm.modalType).toBe('edit');
    expect(vm.modalOpen).toBe(true);
    expect(vm.editingItem).toEqual(institution);
    expect(vm.formData.name).toBe('Test Bank');
  });

  it('should properly open edit account modal', async () => {
    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    const account: Account = {
      id: 1,
      name: 'Test Account',
      userId: 1,
      institutionId: 2,
      typeId: 1,
      statusId: 1,
      createdAt: '',
      updatedAt: '',
    };

    vm.openEditAccountModal(account);

    expect(vm.modalResourceType).toBe('account');
    expect(vm.modalType).toBe('edit');
    expect(vm.modalOpen).toBe(true);
    expect(vm.editingItem).toEqual(account);
    expect(vm.formData.name).toBe('Test Account');
  });

  it('should properly open create account modal with institutions', async () => {
    const mockInstitution1 = createMockInstitution({ id: 1, name: 'Bank A' });
    const mockInstitution2 = createMockInstitution({ id: 2, name: 'Bank B' });

    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({ institutions: [mockInstitution1, mockInstitution2] })
    );

    const wrapper = mount(PortfolioView);
    const vm = wrapper.vm as any;

    vm.openCreateAccountModal();

    expect(vm.modalResourceType).toBe('account');
    expect(vm.modalType).toBe('create');
    expect(vm.modalOpen).toBe(true);
  });
});
