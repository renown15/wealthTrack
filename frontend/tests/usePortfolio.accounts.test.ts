/**
 * Tests for usePortfolio composable - Account operations
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

const mockApiService = apiServiceModule.apiService as any;

describe('usePortfolio - Account Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadPortfolio', () => {
    it('should load portfolio and institutions on success', async () => {
      const mockPortfolioData = {
        items: [
          {
            account: { id: 1, name: 'Savings', userid: 1, institutionid: 1, typeid: 1, statusid: 1, created_at: '', updated_at: '' },
            institution: { id: 1, name: 'Bank', userid: 1, created_at: '', updated_at: '' },
            latest_balance: { id: 1, value: '1000.00', accountid: 1, userid: 1, eventtype: 'balance', created_at: '2026-02-04', updated_at: '' },
          },
        ],
      };
      const mockInstitutions = [{ id: 1, name: 'Bank', userid: 1, created_at: '', updated_at: '' }];

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

  describe('createAccount', () => {
    it('should create account and reload portfolio', async () => {
      mockApiService.createAccount.mockResolvedValue(undefined);
      mockApiService.getPortfolio.mockResolvedValue({ items: [] });
      mockApiService.getInstitutions.mockResolvedValue([]);

      const { createAccount } = usePortfolio();
      await createAccount(1, 'New Account');

      expect(mockApiService.createAccount).toHaveBeenCalledWith({
        institutionid: 1,
        name: 'New Account',
      });
    });

    it('should set error on create account failure', async () => {
      const error = new Error('Create failed');
      mockApiService.createAccount.mockRejectedValue(error);

      const { state, createAccount } = usePortfolio();
      try {
        await createAccount(1, 'New Account');
      } catch {
        // Expected
      }

      expect(state.error).toBe('Create failed');
    });
  });

  describe('updateAccount', () => {
    it('should update account and reload portfolio', async () => {
      mockApiService.updateAccount.mockResolvedValue(undefined);
      mockApiService.getPortfolio.mockResolvedValue({ items: [] });
      mockApiService.getInstitutions.mockResolvedValue([]);

      const { updateAccount } = usePortfolio();
      await updateAccount(1, 'Updated Name');

      expect(mockApiService.updateAccount).toHaveBeenCalledWith(1, { name: 'Updated Name' });
    });

    it('should set error on update account failure', async () => {
      const error = new Error('Update failed');
      mockApiService.updateAccount.mockRejectedValue(error);

      const { state, updateAccount } = usePortfolio();
      try {
        await updateAccount(1, 'Updated Name');
      } catch {
        // Expected
      }

      expect(state.error).toBe('Update failed');
    });
  });

  describe('deleteAccount', () => {
    it('should delete account and reload portfolio', async () => {
      mockApiService.deleteAccount.mockResolvedValue(undefined);
      mockApiService.getPortfolio.mockResolvedValue({ items: [] });
      mockApiService.getInstitutions.mockResolvedValue([]);

      const { deleteAccount } = usePortfolio();
      await deleteAccount(1);

      expect(mockApiService.deleteAccount).toHaveBeenCalledWith(1);
    });

    it('should set error on delete account failure', async () => {
      const error = new Error('Delete failed');
      mockApiService.deleteAccount.mockRejectedValue(error);

      const { state, deleteAccount } = usePortfolio();
      try {
        await deleteAccount(1);
      } catch {
        // Expected
      }

      expect(state.error).toBe('Delete failed');
    });
  });
});
