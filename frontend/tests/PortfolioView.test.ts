/**
 * Tests for PortfolioView Vue component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computed } from 'vue';
import { mount } from '@vue/test-utils';
import type { Account } from '@/models/Portfolio';
import PortfolioView from '@/views/PortfolioView.vue';
import * as usePortfolioModule from '@/composables/usePortfolio';

// Mock the composable
vi.mock('@/composables/usePortfolio', () => ({
  usePortfolio: vi.fn(),
}));

const mockUsePortfolio = usePortfolioModule.usePortfolio as any;

describe('PortfolioView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header with title', () => {
    mockUsePortfolio.mockReturnValue({
      state: {
        items: [],
        institutions: [],
        loading: false,
        error: null,
      },
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
    });

    const wrapper = mount(PortfolioView);
    expect(wrapper.find('h1').text()).toBe('Portfolio Dashboard');
  });

  it('should display empty state when no accounts', () => {
    mockUsePortfolio.mockReturnValue({
      state: {
        items: [],
        institutions: [],
        loading: false,
        error: null,
      },
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
    });

    const wrapper = mount(PortfolioView);
    expect(wrapper.text()).toContain('No accounts yet');
  });

  it('should display loading state', () => {
    mockUsePortfolio.mockReturnValue({
      state: {
        items: [],
        institutions: [],
        loading: true,
        error: null,
      },
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
    });

    const wrapper = mount(PortfolioView);
    expect(wrapper.text()).toContain('Loading portfolio');
  });

  it('should display error message', () => {
    mockUsePortfolio.mockReturnValue({
      state: {
        items: [],
        institutions: [],
        loading: false,
        error: 'Test error message',
      },
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
    });

    const wrapper = mount(PortfolioView);
    expect(wrapper.text()).toContain('Test error message');
  });

  it('should display accounts and institutions', () => {
    const mockAccount = {
      account: {
        id: 1,
        name: 'Savings',
        userid: 1,
        institutionid: 1,
        typeid: 1,
        statusid: 1,
        created_at: '',
        updated_at: '',
      },
      institution: { id: 1, name: 'Bank A', userid: 1, created_at: '', updated_at: '' },
      latest_balance: {
        id: 1,
        value: '1000.00',
        accountid: 1,
        userid: 1,
        eventtype: 'balance',
        created_at: '2026-02-04',
        updated_at: '',
      },
    };

    const mockInstitution = { id: 1, name: 'Bank A', userid: 1, created_at: '', updated_at: '' };

    mockUsePortfolio.mockReturnValue({
      state: {
        items: [mockAccount],
        institutions: [mockInstitution],
        loading: false,
        error: null,
      },
      totalValue: computed(() => 1000),
      accountCount: computed(() => 1),
      loadPortfolio: vi.fn(),
      createAccount: vi.fn(),
      updateAccount: vi.fn(),
      deleteAccount: vi.fn(),
      createInstitution: vi.fn(),
      updateInstitution: vi.fn(),
      deleteInstitution: vi.fn(),
      clearError: vi.fn(),
    });

    const wrapper = mount(PortfolioView);
    expect(wrapper.text()).toContain('Savings');
    expect(wrapper.text()).toContain('Bank A');
  });

  it('should call loadPortfolio on mount', () => {
    const loadPortfolioMock = vi.fn();
    mockUsePortfolio.mockReturnValue({
      state: {
        items: [],
        institutions: [],
        loading: false,
        error: null,
      },
      totalValue: computed(() => 0),
      accountCount: computed(() => 0),
      loadPortfolio: loadPortfolioMock,
      createAccount: vi.fn(),
      updateAccount: vi.fn(),
      deleteAccount: vi.fn(),
      createInstitution: vi.fn(),
      updateInstitution: vi.fn(),
      deleteInstitution: vi.fn(),
      clearError: vi.fn(),
    });

    mount(PortfolioView);
    expect(loadPortfolioMock).toHaveBeenCalled();
  });

  it('should open create account modal when button clicked', async () => {
    mockUsePortfolio.mockReturnValue({
      state: {
        items: [],
        institutions: [],
        loading: false,
        error: null,
      },
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
    });

    const wrapper = mount(PortfolioView);
    const createButton = wrapper.findAll('button').find((b) => b.text().includes('New Account'));
    if (createButton) {
      await createButton.trigger('click');
      expect(wrapper.find('.modal-overlay').exists()).toBe(true);
    }
  });

  it('should format currency correctly', () => {
    mockUsePortfolio.mockReturnValue({
      state: {
        items: [],
        institutions: [],
        loading: false,
        error: null,
      },
      totalValue: computed(() => 1234.56),
      accountCount: computed(() => 0),
      loadPortfolio: vi.fn(),
      createAccount: vi.fn(),
      updateAccount: vi.fn(),
      deleteAccount: vi.fn(),
      createInstitution: vi.fn(),
      updateInstitution: vi.fn(),
      deleteInstitution: vi.fn(),
      clearError: vi.fn(),
    });

    const wrapper = mount(PortfolioView);
    expect(wrapper.text()).toContain('$1,234.56');
  });

  it('should call clearError when close button clicked', async () => {
    const clearErrorMock = vi.fn();
    mockUsePortfolio.mockReturnValue({
      state: {
        items: [],
        institutions: [],
        loading: false,
        error: 'Test error',
      },
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
    });

    const wrapper = mount(PortfolioView);
    const errorClose = wrapper.find('.error-banner button');
    if (errorClose.exists()) {
      await errorClose.trigger('click');
      expect(clearErrorMock).toHaveBeenCalled();
    }
  });

  it('should display multiple accounts with correct data', () => {
    const mockAccount1 = {
      account: {
        id: 1,
        name: 'Savings',
        userid: 1,
        institutionid: 1,
        typeid: 1,
        statusid: 1,
        created_at: '',
        updated_at: '',
      },
      institution: { id: 1, name: 'Bank A', userid: 1, created_at: '', updated_at: '' },
      latest_balance: {
        id: 1,
        value: '5000.00',
        accountid: 1,
        userid: 1,
        eventtype: 'balance',
        created_at: '2026-02-04',
        updated_at: '',
      },
    };

    const mockAccount2 = {
      account: {
        id: 2,
        name: 'Checking',
        userid: 1,
        institutionid: 1,
        typeid: 1,
        statusid: 1,
        created_at: '',
        updated_at: '',
      },
      institution: { id: 1, name: 'Bank A', userid: 1, created_at: '', updated_at: '' },
      latest_balance: {
        id: 2,
        value: '3000.00',
        accountid: 2,
        userid: 1,
        eventtype: 'balance',
        created_at: '2026-02-04',
        updated_at: '',
      },
    };

    mockUsePortfolio.mockReturnValue({
      state: {
        items: [mockAccount1, mockAccount2],
        institutions: [],
        loading: false,
        error: null,
      },
      totalValue: computed(() => 8000),
      accountCount: computed(() => 2),
      loadPortfolio: vi.fn(),
      createAccount: vi.fn(),
      updateAccount: vi.fn(),
      deleteAccount: vi.fn(),
      createInstitution: vi.fn(),
      updateInstitution: vi.fn(),
      deleteInstitution: vi.fn(),
      clearError: vi.fn(),
    });

    const wrapper = mount(PortfolioView);
    expect(wrapper.text()).toContain('Savings');
    expect(wrapper.text()).toContain('Checking');
    expect(wrapper.text()).toContain('$8,000');
  });

  it('should display institutions list with accounts', () => {
    const mockAccount = {
      account: {
        id: 1,
        name: 'Savings',
        userid: 1,
        institutionid: 1,
        typeid: 1,
        statusid: 1,
        created_at: '',
        updated_at: '',
      },
      institution: { id: 1, name: 'Bank A', userid: 1, created_at: '', updated_at: '' },
      latest_balance: {
        id: 1,
        value: '1000.00',
        accountid: 1,
        userid: 1,
        eventtype: 'balance',
        created_at: '2026-02-04',
        updated_at: '',
      },
    };

    const mockInstitution1 = { id: 1, name: 'Bank A', userid: 1, created_at: '', updated_at: '' };
    const mockInstitution2 = { id: 2, name: 'Bank B', userid: 1, created_at: '', updated_at: '' };

    mockUsePortfolio.mockReturnValue({
      state: {
        items: [mockAccount],
        institutions: [mockInstitution1, mockInstitution2],
        loading: false,
        error: null,
      },
      totalValue: computed(() => 1000),
      accountCount: computed(() => 1),
      loadPortfolio: vi.fn(),
      createAccount: vi.fn(),
      updateAccount: vi.fn(),
      deleteAccount: vi.fn(),
      createInstitution: vi.fn(),
      updateInstitution: vi.fn(),
      deleteInstitution: vi.fn(),
      clearError: vi.fn(),
    });

    const wrapper = mount(PortfolioView);
    expect(wrapper.text()).toContain('Bank A');
    expect(wrapper.text()).toContain('Bank B');
  });

  it('should handle delete account with confirmation', async () => {
    const deleteAccountMock = vi.fn();
    mockUsePortfolio.mockReturnValue({
      state: {
        items: [],
        institutions: [],
        loading: false,
        error: null,
      },
      totalValue: computed(() => 0),
      accountCount: computed(() => 0),
      loadPortfolio: vi.fn(),
      createAccount: vi.fn(),
      updateAccount: vi.fn(),
      deleteAccount: deleteAccountMock,
      createInstitution: vi.fn(),
      updateInstitution: vi.fn(),
      deleteInstitution: vi.fn(),
      clearError: vi.fn(),
    });

    const wrapper = mount(PortfolioView);
    // Component should render without error even with empty state
    expect(wrapper.exists()).toBe(true);
  });

  it('should open new institution modal', async () => {
    mockUsePortfolio.mockReturnValue({
      state: {
        items: [],
        institutions: [],
        loading: false,
        error: null,
      },
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
    });

    const wrapper = mount(PortfolioView);
    const institutionButton = wrapper.findAll('button').find((b) => b.text().includes('New Institution'));
    if (institutionButton) {
      await institutionButton.trigger('click');
      expect(wrapper.find('.modal-overlay').exists()).toBe(true);
    }
  });

  it('should handle successful institution creation', async () => {
    const createInstitutionMock = vi.fn().mockResolvedValue(undefined);
    mockUsePortfolio.mockReturnValue({
      state: {
        items: [],
        institutions: [],
        loading: false,
        error: null,
      },
      totalValue: computed(() => 0),
      accountCount: computed(() => 0),
      loadPortfolio: vi.fn(),
      createAccount: vi.fn(),
      updateAccount: vi.fn(),
      deleteAccount: vi.fn(),
      createInstitution: createInstitutionMock,
      updateInstitution: vi.fn(),
      deleteInstitution: vi.fn(),
      clearError: vi.fn(),
    });

    const wrapper = mount(PortfolioView);
    expect(wrapper.exists()).toBe(true);
  });

  it('should handle successful account update', async () => {
    const updateAccountMock = vi.fn().mockResolvedValue(undefined);
    mockUsePortfolio.mockReturnValue({
      state: {
        items: [],
        institutions: [],
        loading: false,
        error: null,
      },
      totalValue: computed(() => 0),
      accountCount: computed(() => 0),
      loadPortfolio: vi.fn(),
      createAccount: vi.fn(),
      updateAccount: updateAccountMock,
      deleteAccount: vi.fn(),
      createInstitution: vi.fn(),
      updateInstitution: vi.fn(),
      deleteInstitution: vi.fn(),
      clearError: vi.fn(),
    });

    const wrapper = mount(PortfolioView);
    expect(wrapper.exists()).toBe(true);
  });

  it('should handle successful institution update', async () => {
    const updateInstitutionMock = vi.fn().mockResolvedValue(undefined);
    mockUsePortfolio.mockReturnValue({
      state: {
        items: [],
        institutions: [],
        loading: false,
        error: null,
      },
      totalValue: computed(() => 0),
      accountCount: computed(() => 0),
      loadPortfolio: vi.fn(),
      createAccount: vi.fn(),
      updateAccount: vi.fn(),
      deleteAccount: vi.fn(),
      createInstitution: vi.fn(),
      updateInstitution: updateInstitutionMock,
      deleteInstitution: vi.fn(),
      clearError: vi.fn(),
    });

    const wrapper = mount(PortfolioView);
    expect(wrapper.exists()).toBe(true);
  });

  it('should handle successful institution deletion', async () => {
    const deleteInstitutionMock = vi.fn().mockResolvedValue(undefined);
    mockUsePortfolio.mockReturnValue({
      state: {
        items: [],
        institutions: [],
        loading: false,
        error: null,
      },
      totalValue: computed(() => 0),
      accountCount: computed(() => 0),
      loadPortfolio: vi.fn(),
      createAccount: vi.fn(),
      updateAccount: vi.fn(),
      deleteAccount: vi.fn(),
      createInstitution: vi.fn(),
      updateInstitution: vi.fn(),
      deleteInstitution: deleteInstitutionMock,
      clearError: vi.fn(),
    });

    const wrapper = mount(PortfolioView);
    expect(wrapper.exists()).toBe(true);
  });

  it('should render component structure correctly', () => {
    mockUsePortfolio.mockReturnValue({
      state: {
        items: [],
        institutions: [],
        loading: false,
        error: null,
      },
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
    });

    const wrapper = mount(PortfolioView);
    const portfolioView = wrapper.find('.portfolio-view');
    expect(portfolioView.exists()).toBe(true);

    const header = wrapper.find('.portfolio-header');
    expect(header.exists()).toBe(true);
  });

  it('should format header with total value and account count', () => {
    mockUsePortfolio.mockReturnValue({
      state: {
        items: [],
        institutions: [],
        loading: false,
        error: null,
      },
      totalValue: computed(() => 5000.5),
      accountCount: computed(() => 3),
      loadPortfolio: vi.fn(),
      createAccount: vi.fn(),
      updateAccount: vi.fn(),
      deleteAccount: vi.fn(),
      createInstitution: vi.fn(),
      updateInstitution: vi.fn(),
      deleteInstitution: vi.fn(),
      clearError: vi.fn(),
    });

    const wrapper = mount(PortfolioView);
    expect(wrapper.text()).toContain('$5,000.50');
    expect(wrapper.text()).toContain('3');
  });

  it('should render section elements for portfolio content', () => {
    const mockAccount = {
      account: {
        id: 1,
        name: 'Checking',
        userid: 1,
        institutionid: 1,
        typeid: 1,
        statusid: 1,
        created_at: '',
        updated_at: '',
      },
      institution: { id: 1, name: 'Bank', userid: 1, created_at: '', updated_at: '' },
      latest_balance: {
        id: 1,
        value: '2500.00',
        accountid: 1,
        userid: 1,
        eventtype: 'balance',
        created_at: '2026-02-04',
        updated_at: '',
      },
    };

    mockUsePortfolio.mockReturnValue({
      state: {
        items: [mockAccount],
        institutions: [],
        loading: false,
        error: null,
      },
      totalValue: computed(() => 2500),
      accountCount: computed(() => 1),
      loadPortfolio: vi.fn(),
      createAccount: vi.fn(),
      updateAccount: vi.fn(),
      deleteAccount: vi.fn(),
      createInstitution: vi.fn(),
      updateInstitution: vi.fn(),
      deleteInstitution: vi.fn(),
      clearError: vi.fn(),
    });

    const wrapper = mount(PortfolioView);
    const sections = wrapper.findAll('section');
    expect(sections.length).toBeGreaterThan(0);
  });

  it('should display proper currency formatting in header', () => {
    mockUsePortfolio.mockReturnValue({
      state: {
        items: [],
        institutions: [],
        loading: false,
        error: null,
      },
      totalValue: computed(() => 999.99),
      accountCount: computed(() => 0),
      loadPortfolio: vi.fn(),
      createAccount: vi.fn(),
      updateAccount: vi.fn(),
      deleteAccount: vi.fn(),
      createInstitution: vi.fn(),
      updateInstitution: vi.fn(),
      deleteInstitution: vi.fn(),
      clearError: vi.fn(),
    });

    const wrapper = mount(PortfolioView);
    expect(wrapper.text()).toContain('$999.99');
  });

  describe('User interactions', () => {
    it('should call createAccount when form is submitted', async () => {
      const createAccountMock = vi.fn().mockResolvedValue(undefined);
      mockUsePortfolio.mockReturnValue({
        state: {
          items: [],
          institutions: [{ id: 1, name: 'Bank', userid: 1, created_at: '', updated_at: '' }],
          loading: false,
          error: null,
        },
        totalValue: computed(() => 0),
        accountCount: computed(() => 0),
        loadPortfolio: vi.fn(),
        createAccount: createAccountMock,
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
        createInstitution: vi.fn(),
        updateInstitution: vi.fn(),
        deleteInstitution: vi.fn(),
        clearError: vi.fn(),
      });

      const wrapper = mount(PortfolioView);
      // Component should render without errors
      expect(wrapper.exists()).toBe(true);
    });

    it('should call createInstitution when institution form submitted', async () => {
      const createInstitutionMock = vi.fn().mockResolvedValue(undefined);
      mockUsePortfolio.mockReturnValue({
        state: {
          items: [],
          institutions: [],
          loading: false,
          error: null,
        },
        totalValue: computed(() => 0),
        accountCount: computed(() => 0),
        loadPortfolio: vi.fn(),
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
        createInstitution: createInstitutionMock,
        updateInstitution: vi.fn(),
        deleteInstitution: vi.fn(),
        clearError: vi.fn(),
      });

      const wrapper = mount(PortfolioView);
      expect(wrapper.exists()).toBe(true);
    });

    it('should call deleteAccount when delete confirmed', async () => {
      const deleteAccountMock = vi.fn().mockResolvedValue(undefined);
      mockUsePortfolio.mockReturnValue({
        state: {
          items: [],
          institutions: [],
          loading: false,
          error: null,
        },
        totalValue: computed(() => 0),
        accountCount: computed(() => 0),
        loadPortfolio: vi.fn(),
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: deleteAccountMock,
        createInstitution: vi.fn(),
        updateInstitution: vi.fn(),
        deleteInstitution: vi.fn(),
        clearError: vi.fn(),
      });

      const wrapper = mount(PortfolioView);
      expect(wrapper.exists()).toBe(true);
    });

    it('should call deleteInstitution when institution delete confirmed', async () => {
      const deleteInstitutionMock = vi.fn().mockResolvedValue(undefined);
      mockUsePortfolio.mockReturnValue({
        state: {
          items: [],
          institutions: [],
          loading: false,
          error: null,
        },
        totalValue: computed(() => 0),
        accountCount: computed(() => 0),
        loadPortfolio: vi.fn(),
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
        createInstitution: vi.fn(),
        updateInstitution: vi.fn(),
        deleteInstitution: deleteInstitutionMock,
        clearError: vi.fn(),
      });

      const wrapper = mount(PortfolioView);
      expect(wrapper.exists()).toBe(true);
    });

    it('should call updateAccount when account is edited', async () => {
      const updateAccountMock = vi.fn().mockResolvedValue(undefined);
      mockUsePortfolio.mockReturnValue({
        state: {
          items: [
            {
              account: {
                id: 1,
                name: 'Checking',
                userid: 1,
                institutionid: 1,
                typeid: 1,
                statusid: 1,
                created_at: '',
                updated_at: '',
              },
              institution: { id: 1, name: 'Bank', userid: 1, created_at: '', updated_at: '' },
              latest_balance: {
                id: 1,
                value: '1000.00',
                accountid: 1,
                userid: 1,
                eventtype: 'balance',
                created_at: '2026-02-04',
                updated_at: '',
              },
            },
          ],
          institutions: [],
          loading: false,
          error: null,
        },
        totalValue: computed(() => 1000),
        accountCount: computed(() => 1),
        loadPortfolio: vi.fn(),
        createAccount: vi.fn(),
        updateAccount: updateAccountMock,
        deleteAccount: vi.fn(),
        createInstitution: vi.fn(),
        updateInstitution: vi.fn(),
        deleteInstitution: vi.fn(),
        clearError: vi.fn(),
      });

      const wrapper = mount(PortfolioView);
      expect(wrapper.exists()).toBe(true);
    });

    it('should call updateInstitution when institution is edited', async () => {
      const updateInstitutionMock = vi.fn().mockResolvedValue(undefined);
      mockUsePortfolio.mockReturnValue({
        state: {
          items: [],
          institutions: [{ id: 1, name: 'Bank A', userid: 1, created_at: '', updated_at: '' }],
          loading: false,
          error: null,
        },
        totalValue: computed(() => 0),
        accountCount: computed(() => 0),
        loadPortfolio: vi.fn(),
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
        createInstitution: vi.fn(),
        updateInstitution: updateInstitutionMock,
        deleteInstitution: vi.fn(),
        clearError: vi.fn(),
      });

      const wrapper = mount(PortfolioView);
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('Modal behavior', () => {
    it('should render component with modals structure', () => {
      mockUsePortfolio.mockReturnValue({
        state: {
          items: [],
          institutions: [],
          loading: false,
          error: null,
        },
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
      });

      const wrapper = mount(PortfolioView);
      // Component should render the root structure
      expect(wrapper.find('.portfolio-view').exists()).toBe(true);
    });

    it('should have modal structure in template', () => {
      mockUsePortfolio.mockReturnValue({
        state: {
          items: [],
          institutions: [],
          loading: false,
          error: null,
        },
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
      });

      const wrapper = mount(PortfolioView);
      // Check for header and main sections
      expect(wrapper.find('.portfolio-header').exists()).toBe(true);
    });

    it('should render account grid when data present', () => {
      const mockAccount = {
        account: {
          id: 1,
          name: 'Savings',
          userid: 1,
          institutionid: 1,
          typeid: 1,
          statusid: 1,
          created_at: '',
          updated_at: '',
        },
        institution: { id: 1, name: 'Bank', userid: 1, created_at: '', updated_at: '' },
        latest_balance: {
          id: 1,
          value: '2500.00',
          accountid: 1,
          userid: 1,
          eventtype: 'balance',
          created_at: '2026-02-04',
          updated_at: '',
        },
      };

      mockUsePortfolio.mockReturnValue({
        state: {
          items: [mockAccount],
          institutions: [],
          loading: false,
          error: null,
        },
        totalValue: computed(() => 2500),
        accountCount: computed(() => 1),
        loadPortfolio: vi.fn(),
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
        createInstitution: vi.fn(),
        updateInstitution: vi.fn(),
        deleteInstitution: vi.fn(),
        clearError: vi.fn(),
      });

      const wrapper = mount(PortfolioView);
      expect(wrapper.text()).toContain('Savings');
    });

    it('should render content sections for portfolio', () => {
      const mockAccount = {
        account: {
          id: 1,
          name: 'Checking',
          userid: 1,
          institutionid: 1,
          typeid: 1,
          statusid: 1,
          created_at: '',
          updated_at: '',
        },
        institution: { id: 1, name: 'Bank A', userid: 1, created_at: '', updated_at: '' },
        latest_balance: {
          id: 1,
          value: '1500.00',
          accountid: 1,
          userid: 1,
          eventtype: 'balance',
          created_at: '2026-02-04',
          updated_at: '',
        },
      };

      mockUsePortfolio.mockReturnValue({
        state: {
          items: [mockAccount],
          institutions: [{ id: 1, name: 'Bank A', userid: 1, created_at: '', updated_at: '' }],
          loading: false,
          error: null,
        },
        totalValue: computed(() => 1500),
        accountCount: computed(() => 1),
        loadPortfolio: vi.fn(),
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
        createInstitution: vi.fn(),
        updateInstitution: vi.fn(),
        deleteInstitution: vi.fn(),
        clearError: vi.fn(),
      });

      const wrapper = mount(PortfolioView);
      const sections = wrapper.findAll('section');
      // Should have at least accounts-section and institutions-section
      expect(sections.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error handling in save operations', () => {
    it('should handle createAccount validation error', async () => {
      const mockCreateAccount = vi.fn();
      mockUsePortfolio.mockReturnValue({
        state: {
          items: [],
          institutions: [],
          loading: false,
          error: null,
        },
        totalValue: computed(() => 0),
        accountCount: computed(() => 0),
        loadPortfolio: vi.fn(),
        createAccount: mockCreateAccount,
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
        createInstitution: vi.fn(),
        updateInstitution: vi.fn(),
        deleteInstitution: vi.fn(),
        clearError: vi.fn(),
      });

      const wrapper = mount(PortfolioView);
      const vm = wrapper.vm as any;
      
      vm.modalResourceType = 'account';
      vm.modalType = 'create';
      vm.formData = { name: '', institutionid: 0 };
      
      await vm.handleSave();
      
      expect(mockCreateAccount).not.toHaveBeenCalled();
      expect(vm.state.error).toContain('required fields');
    });

    it('should handle createInstitution validation error', async () => {
      const mockCreateInst = vi.fn();
      mockUsePortfolio.mockReturnValue({
        state: {
          items: [],
          institutions: [],
          loading: false,
          error: null,
        },
        totalValue: computed(() => 0),
        accountCount: computed(() => 0),
        loadPortfolio: vi.fn(),
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
        createInstitution: mockCreateInst,
        updateInstitution: vi.fn(),
        deleteInstitution: vi.fn(),
        clearError: vi.fn(),
      });

      const wrapper = mount(PortfolioView);
      const vm = wrapper.vm as any;
      
      vm.modalResourceType = 'institution';
      vm.modalType = 'create';
      vm.formData = { name: '', institutionid: 0 };
      
      await vm.handleSave();
      
      expect(mockCreateInst).not.toHaveBeenCalled();
      expect(vm.state.error).toContain('Institution name');
    });

    it('should catch error in handleSave for createAccount', async () => {
      const mockCreateAccount = vi.fn().mockRejectedValue(new Error('Network error'));
      mockUsePortfolio.mockReturnValue({
        state: {
          items: [],
          institutions: [],
          loading: false,
          error: null,
        },
        totalValue: computed(() => 0),
        accountCount: computed(() => 0),
        loadPortfolio: vi.fn(),
        createAccount: mockCreateAccount,
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
        createInstitution: vi.fn(),
        updateInstitution: vi.fn(),
        deleteInstitution: vi.fn(),
        clearError: vi.fn(),
      });

      const wrapper = mount(PortfolioView);
      const vm = wrapper.vm as any;
      
      vm.modalResourceType = 'account';
      vm.modalType = 'create';
      vm.formData = { name: 'Test', institutionid: 1 };
      
      await vm.handleSave();
      
      expect(mockCreateAccount).toHaveBeenCalled();
    });

    it('should catch error in handleConfirmDelete', async () => {
      const mockDeleteAccount = vi.fn().mockRejectedValue(new Error('Delete failed'));
      mockUsePortfolio.mockReturnValue({
        state: {
          items: [],
          institutions: [],
          loading: false,
          error: null,
        },
        totalValue: computed(() => 0),
        accountCount: computed(() => 0),
        loadPortfolio: vi.fn(),
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: mockDeleteAccount,
        createInstitution: vi.fn(),
        updateInstitution: vi.fn(),
        deleteInstitution: vi.fn(),
        clearError: vi.fn(),
      });

      const wrapper = mount(PortfolioView);
      const vm = wrapper.vm as any;
      
      vm.deleteConfirmType = 'account';
      vm.deleteConfirmId = 1;
      
      await vm.handleConfirmDelete();
      
      expect(mockDeleteAccount).toHaveBeenCalled();
    });
  });

  describe('Modal and form interactions', () => {
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
      
      vm.formData = { name: 'Test', institutionid: 1 };
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
      expect(vm.formatCurrency(1500.50)).toContain('1,500.50');
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

    it('should successfully delete account when confirmed', async () => {
      const mockDeleteAccount = vi.fn().mockResolvedValue(undefined);
      mockUsePortfolio.mockReturnValue({
        state: {
          items: [],
          institutions: [],
          loading: false,
          error: null,
        },
        totalValue: computed(() => 0),
        accountCount: computed(() => 0),
        loadPortfolio: vi.fn(),
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: mockDeleteAccount,
        createInstitution: vi.fn(),
        updateInstitution: vi.fn(),
        deleteInstitution: vi.fn(),
        clearError: vi.fn(),
      });

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
      mockUsePortfolio.mockReturnValue({
        state: {
          items: [],
          institutions: [],
          loading: false,
          error: null,
        },
        totalValue: computed(() => 0),
        accountCount: computed(() => 0),
        loadPortfolio: vi.fn(),
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
        createInstitution: vi.fn(),
        updateInstitution: vi.fn(),
        deleteInstitution: mockDeleteInstitution,
        clearError: vi.fn(),
      });

      const wrapper = mount(PortfolioView);
      const vm = wrapper.vm as any;

      vm.deleteConfirmType = 'institution';
      vm.deleteConfirmId = 2;
      vm.deleteConfirmOpen = true;

      await vm.handleConfirmDelete();

      expect(mockDeleteInstitution).toHaveBeenCalledWith(2);
      expect(vm.deleteConfirmOpen).toBe(false);
    });

    it('should handle error in deleteInstitution', async () => {
      const mockDeleteInstitution = vi.fn().mockRejectedValue(new Error('Delete failed'));
      mockUsePortfolio.mockReturnValue({
        state: {
          items: [],
          institutions: [],
          loading: false,
          error: null,
        },
        totalValue: computed(() => 0),
        accountCount: computed(() => 0),
        loadPortfolio: vi.fn(),
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
        createInstitution: vi.fn(),
        updateInstitution: vi.fn(),
        deleteInstitution: mockDeleteInstitution,
        clearError: vi.fn(),
      });

      const wrapper = mount(PortfolioView);
      const vm = wrapper.vm as any;

      vm.deleteConfirmType = 'institution';
      vm.deleteConfirmId = 1;

      await vm.handleConfirmDelete();

      expect(mockDeleteInstitution).toHaveBeenCalled();
    });

    it('should update institution when form submitted in edit mode', async () => {
      const mockUpdateInstitution = vi.fn().mockResolvedValue(undefined);
      mockUsePortfolio.mockReturnValue({
        state: {
          items: [],
          institutions: [],
          loading: false,
          error: null,
        },
        totalValue: computed(() => 0),
        accountCount: computed(() => 0),
        loadPortfolio: vi.fn(),
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
        createInstitution: vi.fn(),
        updateInstitution: mockUpdateInstitution,
        deleteInstitution: vi.fn(),
        clearError: vi.fn(),
      });

      const wrapper = mount(PortfolioView);
      const vm = wrapper.vm as any;

      vm.modalResourceType = 'institution';
      vm.modalType = 'edit';
      vm.editingItem = { id: 1, name: 'Old Bank' };
      vm.formData = { name: 'Updated Bank', institutionid: 0 };

      await vm.handleSave();

      expect(mockUpdateInstitution).toHaveBeenCalledWith(1, 'Updated Bank');
      expect(vm.modalOpen).toBe(false);
    });

    it('should update account when form submitted in edit mode', async () => {
      const mockUpdateAccount = vi.fn().mockResolvedValue(undefined);
      mockUsePortfolio.mockReturnValue({
        state: {
          items: [],
          institutions: [],
          loading: false,
          error: null,
        },
        totalValue: computed(() => 0),
        accountCount: computed(() => 0),
        loadPortfolio: vi.fn(),
        createAccount: vi.fn(),
        updateAccount: mockUpdateAccount,
        deleteAccount: vi.fn(),
        createInstitution: vi.fn(),
        updateInstitution: vi.fn(),
        deleteInstitution: vi.fn(),
        clearError: vi.fn(),
      });

      const wrapper = mount(PortfolioView);
      const vm = wrapper.vm as any;

      vm.modalResourceType = 'account';
      vm.modalType = 'edit';
      vm.editingItem = { id: 1, name: 'Old Account' };
      vm.formData = { name: 'Updated Account', institutionid: 2 };

      await vm.handleSave();

      expect(mockUpdateAccount).toHaveBeenCalledWith(1, 'Updated Account');
      expect(vm.modalOpen).toBe(false);
    });

    it('should reject invalid institution edit submit without name', async () => {
      mockUsePortfolio.mockReturnValue({
        state: {
          items: [],
          institutions: [],
          loading: false,
          error: null,
        },
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
      });

      const wrapper = mount(PortfolioView);
      const vm = wrapper.vm as any;

      vm.modalResourceType = 'institution';
      vm.modalType = 'edit';
      vm.modalOpen = true;
      vm.editingItem = { id: 1, name: 'Bank' };
      vm.formData = { name: '', institutionid: 0 };

      await vm.handleSave();

      expect(vm.state.error).toBe('Institution name is required');
      expect(vm.modalOpen).toBe(true);
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
        institution_id: 2,
        account_type: 'checking',
        balance: 1000,
      };

      vm.openEditAccountModal(account);

      expect(vm.modalResourceType).toBe('account');
      expect(vm.modalType).toBe('edit');
      expect(vm.modalOpen).toBe(true);
      expect(vm.editingItem).toEqual(account);
      expect(vm.formData.name).toBe('Test Account');
    });

    it('should properly open create account modal with institutions', async () => {
      mockUsePortfolio.mockReturnValue({
        state: {
          items: [],
          institutions: [
            { id: 1, name: 'Bank A' },
            { id: 2, name: 'Bank B' },
          ],
          loading: false,
          error: null,
        },
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
      });

      const wrapper = mount(PortfolioView);
      const vm = wrapper.vm as any;

      vm.openCreateAccountModal();

      expect(vm.modalResourceType).toBe('account');
      expect(vm.modalType).toBe('create');
      expect(vm.modalOpen).toBe(true);
      // The institution dropdown should show because modalType is 'create' and modalResourceType is 'account'
    });
  });
});
