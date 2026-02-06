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

  describe('loadPortfolio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadPortfolio', () => {
    it('should load portfolio and institutions on success', async () => {
      const mockPortfolioData = {
        items: [
          {
            account: { id: 1, name: 'Savings', userId: 1, institutionId: 1, typeId: 1, statusId: 1, createdAt: '', updatedAt: '' },
            institution: { id: 1, name: 'Bank', userId: 1, createdAt: '', updatedAt: '' },
            latestBalance: { id: 1, value: '1000.00', accountId: 1, userId: 1, eventType: 'balance', createdAt: '2026-02-04', updatedAt: '' },
          },
        ],
      };
      const mockInstitutions = [{ id: 1, name: 'Bank', userId: 1, createdAt: '', updatedAt: '' }];

      mockApiService.getPortfolio.mockResolvedValue(mockPortfolioData);
      mockApiService.getInstitutions.mockResolvedValue(mockInstitutions);

      const { state, loadPortfolio } = usePortfolio();
      await loadPortfolio();

      expect(state.items).toEqual(mockPortfolioData.items);
      expect(state.institutions).toEqual(mockInstitutions);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set error on portfolio load failure', async () => {
      const error = new Error('Network error');
      mockApiService.getPortfolio.mockRejectedValue(error);

      const { state, loadPortfolio } = usePortfolio();
      await loadPortfolio();

      expect(state.error).toBe('Network error');
      expect(state.items).toEqual([]);
    });

    it('should set loading state during fetch', async () => {
      mockApiService.getPortfolio.mockResolvedValue({ items: [] });
      mockApiService.getInstitutions.mockResolvedValue([]);

      const { state, loadPortfolio } = usePortfolio();
      const promise = loadPortfolio();
      expect(state.loading).toBe(true);
      await promise;
      expect(state.loading).toBe(false);
    });
  });

  });

  describe('createAccount', () => {
    it('should create account and reload portfolio', async () => {
      mockApiService.createAccount.mockResolvedValue(undefined);
      const { createAccount } = usePortfolio();
      await createAccount(1, 'Test');
      expect(mockApiService.createAccount).toHaveBeenCalled();
    });
  });
});