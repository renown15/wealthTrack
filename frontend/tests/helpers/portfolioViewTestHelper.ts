/**
 * Shared test helpers for PortfolioView tests
 */
import { vi } from 'vitest';
import { computed } from 'vue';

export interface MockPortfolioState {
  items: any[];
  institutions: any[];
  loading: boolean;
  error: string | null;
}

export interface MockPortfolioReturn {
  state: MockPortfolioState;
  totalValue: ReturnType<typeof computed>;
  accountCount: ReturnType<typeof computed>;
  loadPortfolio: ReturnType<typeof vi.fn>;
  createAccount: ReturnType<typeof vi.fn>;
  updateAccount: ReturnType<typeof vi.fn>;
  deleteAccount: ReturnType<typeof vi.fn>;
  createInstitution: ReturnType<typeof vi.fn>;
  updateInstitution: ReturnType<typeof vi.fn>;
  deleteInstitution: ReturnType<typeof vi.fn>;
  clearError: ReturnType<typeof vi.fn>;
}

export function createMockPortfolioReturn(
  overrides: Partial<MockPortfolioState> = {},
  mockFns: Partial<Record<string, ReturnType<typeof vi.fn>>> = {}
): MockPortfolioReturn {
  const state: MockPortfolioState = {
    items: [],
    institutions: [],
    loading: false,
    error: null,
    ...overrides,
  };

  return {
    state,
    totalValue: computed(() => mockFns.totalValue?.() ?? 0),
    accountCount: computed(() => mockFns.accountCount?.() ?? 0),
    loadPortfolio: mockFns.loadPortfolio ?? vi.fn(),
    createAccount: mockFns.createAccount ?? vi.fn(),
    updateAccount: mockFns.updateAccount ?? vi.fn(),
    deleteAccount: mockFns.deleteAccount ?? vi.fn(),
    createInstitution: mockFns.createInstitution ?? vi.fn(),
    updateInstitution: mockFns.updateInstitution ?? vi.fn(),
    deleteInstitution: mockFns.deleteInstitution ?? vi.fn(),
    clearError: mockFns.clearError ?? vi.fn(),
  };
}

export function createMockAccount(overrides: Partial<any> = {}) {
  return {
    account: {
      id: 1,
      name: 'Savings',
      userId: 1,
      institutionId: 1,
      typeId: 1,
      statusId: 1,
      createdAt: '',
      updatedAt: '',
      ...overrides.account,
    },
    institution: {
      id: 1,
      name: 'Bank A',
      userId: 1,
      createdAt: '',
      updatedAt: '',
      ...overrides.institution,
    },
    latestBalance: {
      id: 1,
      value: '1000.00',
      accountId: 1,
      userId: 1,
      eventType: 'balance',
      createdAt: '2026-02-04',
      updatedAt: '',
      ...overrides.latest_balance,
    },
    ...overrides,
  };
}

export function createMockInstitution(overrides: Partial<any> = {}) {
  return {
    id: 1,
    name: 'Bank A',
    userId: 1,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}
