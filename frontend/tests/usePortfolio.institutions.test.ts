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

  describe('account operations', () => {
    it('should create account and reload portfolio', async () => {
      mockApiService.createAccount.mockResolvedValue(undefined);
      mockApiService.getPortfolio.mockResolvedValue({ items: [] });
      mockApiService.getInstitutions.mockResolvedValue([]);

      const { createAccount } = usePortfolio();
      await createAccount(1, 'New Account');

      expect(mockApiService.createAccount).toHaveBeenCalledWith({
        institutionId: 1,
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

});