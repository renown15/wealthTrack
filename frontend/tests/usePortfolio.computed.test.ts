/**
 * Tests for usePortfolio composable - Computed properties and utilities
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePortfolio } from '@/composables/usePortfolio';
import * as apiServiceModule from '@/services/ApiService';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    getPortfolio: vi.fn(),
    getInstitutions: vi.fn(),
    createAccount: vi.fn(),
    updateAccount: vi.fn(),
    deleteAccount: vi.fn(),
    createInstitution: vi.fn(),
    updateInstitution: vi.fn(),
    deleteInstitution: vi.fn(),
  },
}));

describe('usePortfolio - Computed Properties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('computed properties', () => {
    it('should calculate totalValue from account balances', () => {
      const { state, totalValue } = usePortfolio();

      state.items = [
        {
          account: { id: 1, name: 'A', userid: 1, institutionid: 1, typeid: 1, statusid: 1, created_at: '', updated_at: '' },
          institution: null,
          latest_balance: { id: 1, value: '1000', accountid: 1, userid: 1, eventtype: 'balance', created_at: '', updated_at: '' },
        },
        {
          account: { id: 2, name: 'B', userid: 1, institutionid: 1, typeid: 1, statusid: 1, created_at: '', updated_at: '' },
          institution: null,
          latest_balance: { id: 2, value: '500', accountid: 2, userid: 1, eventtype: 'balance', created_at: '', updated_at: '' },
        },
      ];

      expect(totalValue.value).toBe(1500);
    });

    it('should handle missing balances in totalValue calculation', () => {
      const { state, totalValue } = usePortfolio();

      state.items = [
        {
          account: { id: 1, name: 'A', userid: 1, institutionid: 1, typeid: 1, statusid: 1, created_at: '', updated_at: '' },
          institution: null,
          latest_balance: null,
        },
      ];

      expect(totalValue.value).toBe(0);
    });

    it('should return correct accountCount', () => {
      const { state, accountCount } = usePortfolio();

      state.items = [
        {
          account: { id: 1, name: 'A', userid: 1, institutionid: 1, typeid: 1, statusid: 1, created_at: '', updated_at: '' },
          institution: null,
          latest_balance: null,
        },
        {
          account: { id: 2, name: 'B', userid: 1, institutionid: 1, typeid: 1, statusid: 1, created_at: '', updated_at: '' },
          institution: null,
          latest_balance: null,
        },
      ];

      expect(accountCount.value).toBe(2);
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      const { state, clearError } = usePortfolio();

      state.error = 'Some error';
      clearError();

      expect(state.error).toBeNull();
    });
  });
});
