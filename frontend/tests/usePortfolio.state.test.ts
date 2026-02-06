/**
 * Tests for usePortfolio composable
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePortfolio } from '@composables/usePortfolio';
import * as apiServiceModule from '@services/ApiService';

// Mock the API service
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

const mockApiService = apiServiceModule.apiService as any;

describe('usePortfolio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('computed properties', () => {
    it('should calculate totalValue from account balances', () => {
      const { state, totalValue } = usePortfolio();

      state.items = [
        {
          account: { id: 1, name: 'A', userId: 1, institutionId: 1, typeId: 1, statusId: 1, createdAt: '', updatedAt: '' },
          institution: null,
          latestBalance: { id: 1, value: '1000', accountId: 1, userId: 1, eventType: 'balance', createdAt: '', updatedAt: '' },
        },
        {
          account: { id: 2, name: 'B', userId: 1, institutionId: 1, typeId: 1, statusId: 1, createdAt: '', updatedAt: '' },
          institution: null,
          latestBalance: { id: 2, value: '500', accountId: 2, userId: 1, eventType: 'balance', createdAt: '', updatedAt: '' },
        },
      ];

      expect(totalValue.value).toBe(1500);
    });

    it('should handle missing balances in totalValue calculation', () => {
      const { state, totalValue } = usePortfolio();

      state.items = [
        {
          account: { id: 1, name: 'A', userId: 1, institutionId: 1, typeId: 1, statusId: 1, createdAt: '', updatedAt: '' },
          institution: null,
          latestBalance: null,
        },
      ];

      expect(totalValue.value).toBe(0);
    });

    it('should return correct accountCount', () => {
      const { state, accountCount } = usePortfolio();

      state.items = [
        {
          account: { id: 1, name: 'A', userId: 1, institutionId: 1, typeId: 1, statusId: 1, createdAt: '', updatedAt: '' },
          institution: null,
          latestBalance: null,
        },
        {
          account: { id: 2, name: 'B', userId: 1, institutionId: 1, typeId: 1, statusId: 1, createdAt: '', updatedAt: '' },
          institution: null,
          latestBalance: null,
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

  describe('Error handling with Error objects', () => {
    it('should handle Error object in loadPortfolio catch', async () => {
      const mockError = new Error('Load failed');
      const { state, loadPortfolio } = usePortfolio();
      
      mockApiService.getPortfolio.mockRejectedValue(mockError);
      
      await loadPortfolio();
      
      expect(state.error).toBe('Load failed');
    });

    it('should handle non-Error object in loadPortfolio catch', async () => {
      const { state, loadPortfolio } = usePortfolio();
      
      mockApiService.getPortfolio.mockRejectedValue('String error');
      
      await loadPortfolio();
      
      expect(state.error).toBe('Failed to load portfolio');
    });

    it('should handle Error object in createAccount catch', async () => {
      const mockError = new Error('Network error');
      const { state, createAccount } = usePortfolio();
      mockApiService.createAccount.mockRejectedValue(mockError);
      try {
        await createAccount(1, 'Test');
      } catch {
        // Expected to throw
      }
      expect(state.error).toBe('Network error');
    });
  });
});