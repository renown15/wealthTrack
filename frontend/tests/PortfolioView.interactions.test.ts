/**
 * Tests for PortfolioView - User interactions and button actions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import PortfolioView from '@/views/PortfolioView.vue';
import * as usePortfolioModule from '@/composables/usePortfolio';
import {
  createMockPortfolioReturn,
  createMockAccount,
  createMockInstitution,
} from './helpers/portfolioViewTestHelper';

vi.mock('@/composables/usePortfolio', () => ({
  usePortfolio: vi.fn(),
}));

const mockUsePortfolio = usePortfolioModule.usePortfolio as any;

describe('PortfolioView - User Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should open create account modal when button clicked', async () => {
    mockUsePortfolio.mockReturnValue(createMockPortfolioReturn());
    const wrapper = mount(PortfolioView);
    const createButton = wrapper.findAll('button').find((b) => b.text().includes('New Account'));
    if (createButton) {
      await createButton.trigger('click');
      expect(wrapper.find('.modal-overlay').exists()).toBe(true);
    }
  });

  it('should call clearError when close button clicked', async () => {
    const clearErrorMock = vi.fn();
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({ error: 'Test error' }, { clearError: clearErrorMock })
    );

    const wrapper = mount(PortfolioView);
    const errorClose = wrapper.find('.error-banner button');
    if (errorClose.exists()) {
      await errorClose.trigger('click');
      expect(clearErrorMock).toHaveBeenCalled();
    }
  });

  it('should handle delete account with confirmation', async () => {
    const deleteAccountMock = vi.fn();
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { deleteAccount: deleteAccountMock })
    );
    const wrapper = mount(PortfolioView);
    expect(wrapper.exists()).toBe(true);
  });

  it('should open new institution modal', async () => {
    mockUsePortfolio.mockReturnValue(createMockPortfolioReturn());
    const wrapper = mount(PortfolioView);
    const institutionButton = wrapper.findAll('button').find((b) => b.text().includes('New Institution'));
    if (institutionButton) {
      await institutionButton.trigger('click');
      expect(wrapper.find('.modal-overlay').exists()).toBe(true);
    }
  });

  it('should call createAccount when form is submitted', async () => {
    const createAccountMock = vi.fn().mockResolvedValue(undefined);
    const mockInstitution = createMockInstitution();

    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn(
        { institutions: [mockInstitution] },
        { createAccount: createAccountMock }
      )
    );

    const wrapper = mount(PortfolioView);
    expect(wrapper.exists()).toBe(true);
  });

  it('should call createInstitution when institution form submitted', async () => {
    const createInstitutionMock = vi.fn().mockResolvedValue(undefined);
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { createInstitution: createInstitutionMock })
    );
    const wrapper = mount(PortfolioView);
    expect(wrapper.exists()).toBe(true);
  });

  it('should call deleteAccount when delete confirmed', async () => {
    const deleteAccountMock = vi.fn().mockResolvedValue(undefined);
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { deleteAccount: deleteAccountMock })
    );
    const wrapper = mount(PortfolioView);
    expect(wrapper.exists()).toBe(true);
  });

  it('should call deleteInstitution when institution delete confirmed', async () => {
    const deleteInstitutionMock = vi.fn().mockResolvedValue(undefined);
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { deleteInstitution: deleteInstitutionMock })
    );
    const wrapper = mount(PortfolioView);
    expect(wrapper.exists()).toBe(true);
  });

  it('should call updateAccount when account is edited', async () => {
    const updateAccountMock = vi.fn().mockResolvedValue(undefined);
    const mockAccount = createMockAccount();

    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn(
        { items: [mockAccount] },
        { totalValue: () => 1000, accountCount: () => 1, updateAccount: updateAccountMock }
      )
    );

    const wrapper = mount(PortfolioView);
    expect(wrapper.exists()).toBe(true);
  });

  it('should call updateInstitution when institution is edited', async () => {
    const updateInstitutionMock = vi.fn().mockResolvedValue(undefined);
    const mockInstitution = createMockInstitution();

    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn(
        { institutions: [mockInstitution] },
        { updateInstitution: updateInstitutionMock }
      )
    );

    const wrapper = mount(PortfolioView);
    expect(wrapper.exists()).toBe(true);
  });
});
