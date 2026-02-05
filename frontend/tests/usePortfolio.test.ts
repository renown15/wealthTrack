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

  describe('createInstitution', () => {
    it('should create institution and reload portfolio', async () => {
      mockApiService.createInstitution.mockResolvedValue(undefined);
      mockApiService.getPortfolio.mockResolvedValue({ items: [] });
      mockApiService.getInstitutions.mockResolvedValue([]);

      const { createInstitution } = usePortfolio();
      await createInstitution('New Bank');

      expect(mockApiService.createInstitution).toHaveBeenCalledWith({ name: 'New Bank' });
    });

    it('should set error on create institution failure', async () => {
      const error = new Error('Create failed');
      mockApiService.createInstitution.mockRejectedValue(error);

      const { state, createInstitution } = usePortfolio();
      try {
        await createInstitution('New Bank');
      } catch {
        // Expected
      }

      expect(state.error).toBe('Create failed');
    });
  });

  describe('updateInstitution', () => {
    it('should update institution and reload portfolio', async () => {
      mockApiService.updateInstitution.mockResolvedValue(undefined);
      mockApiService.getPortfolio.mockResolvedValue({ items: [] });
      mockApiService.getInstitutions.mockResolvedValue([]);

      const { updateInstitution } = usePortfolio();
      await updateInstitution(1, 'Updated Bank');

      expect(mockApiService.updateInstitution).toHaveBeenCalledWith(1, { name: 'Updated Bank' });
    });

    it('should set error on update institution failure', async () => {
      const error = new Error('Update failed');
      mockApiService.updateInstitution.mockRejectedValue(error);

      const { state, updateInstitution } = usePortfolio();
      try {
        await updateInstitution(1, 'Updated Bank');
      } catch {
        // Expected
      }

      expect(state.error).toBe('Update failed');
    });
  });

  describe('deleteInstitution', () => {
    it('should delete institution and reload portfolio', async () => {
      mockApiService.deleteInstitution.mockResolvedValue(undefined);
      mockApiService.getPortfolio.mockResolvedValue({ items: [] });
      mockApiService.getInstitutions.mockResolvedValue([]);

      const { deleteInstitution } = usePortfolio();
      await deleteInstitution(1);

      expect(mockApiService.deleteInstitution).toHaveBeenCalledWith(1);
    });

    it('should set error on delete institution failure', async () => {
      const error = new Error('Delete failed');
      mockApiService.deleteInstitution.mockRejectedValue(error);

      const { state, deleteInstitution } = usePortfolio();
      try {
        await deleteInstitution(1);
      } catch {
        // Expected
      }

      expect(state.error).toBe('Delete failed');
    });
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
      const { createAccount } = usePortfolio();
      
      mockApiService.createAccount.mockRejectedValue(mockError);
      
      await expect(createAccount(1, 'Test')).rejects.toThrow();
    });

    it('should handle non-Error object in createAccount catch', async () => {
      const { createAccount } = usePortfolio();
      
      mockApiService.createAccount.mockRejectedValue('String error');
      
      await expect(createAccount(1, 'Test')).rejects.toBeDefined();
    });

    it('should handle Error object in updateAccount catch', async () => {
      const mockError = new Error('Update failed');
      const { updateAccount } = usePortfolio();
      
      mockApiService.updateAccount.mockRejectedValue(mockError);
      
      await expect(updateAccount(1, 'Updated')).rejects.toThrow();
    });

    it('should handle non-Error object in updateAccount catch', async () => {
      const { updateAccount } = usePortfolio();
      
      mockApiService.updateAccount.mockRejectedValue({ status: 400 });
      
      await expect(updateAccount(1, 'Updated')).rejects.toBeDefined();
    });

    it('should handle Error object in deleteAccount catch', async () => {
      const mockError = new Error('Delete error');
      const { deleteAccount } = usePortfolio();
      
      mockApiService.deleteAccount.mockRejectedValue(mockError);
      
      await expect(deleteAccount(1)).rejects.toThrow();
    });

    it('should handle non-Error object in deleteAccount catch', async () => {
      const { deleteAccount } = usePortfolio();
      
      mockApiService.deleteAccount.mockRejectedValue('Unknown error');
      
      await expect(deleteAccount(1)).rejects.toBeDefined();
    });

    it('should handle Error object in createInstitution catch', async () => {
      const mockError = new Error('Institution create failed');
      const { createInstitution } = usePortfolio();
      
      mockApiService.createInstitution.mockRejectedValue(mockError);
      
      await expect(createInstitution('Bank')).rejects.toThrow();
    });

    it('should handle non-Error object in createInstitution catch', async () => {
      const { createInstitution } = usePortfolio();
      
      mockApiService.createInstitution.mockRejectedValue(123);
      
      await expect(createInstitution('Bank')).rejects.toBeDefined();
    });

    it('should handle Error object in updateInstitution catch', async () => {
      const mockError = new Error('Institution update failed');
      const { updateInstitution } = usePortfolio();
      
      mockApiService.updateInstitution.mockRejectedValue(mockError);
      
      await expect(updateInstitution(1, 'Updated Bank')).rejects.toThrow();
    });

    it('should handle non-Error object in updateInstitution catch', async () => {
      const { updateInstitution } = usePortfolio();
      
      mockApiService.updateInstitution.mockRejectedValue(false);
      
      await expect(updateInstitution(1, 'Updated Bank')).rejects.toBeDefined();
    });

    it('should handle Error object in deleteInstitution catch', async () => {
      const mockError = new Error('Institution delete failed');
      const { deleteInstitution } = usePortfolio();
      
      mockApiService.deleteInstitution.mockRejectedValue(mockError);
      
      await expect(deleteInstitution(1)).rejects.toThrow();
    });

    it('should handle non-Error object in deleteInstitution catch', async () => {
      const { deleteInstitution } = usePortfolio();
      
      mockApiService.deleteInstitution.mockRejectedValue({ error: true });
      
      await expect(deleteInstitution(1)).rejects.toBeDefined();
    });
  });
});
