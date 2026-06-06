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

    it('should rethrow on create account failure', async () => {
      const error = new Error('Create failed');
      mockApiService.createAccount.mockRejectedValue(error);

      const { createAccount } = usePortfolio();
      await expect(createAccount(1, 'New Account')).rejects.toThrow('Create failed');
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

    it('should rethrow on update account failure', async () => {
      const error = new Error('Update failed');
      mockApiService.updateAccount.mockRejectedValue(error);

      const { updateAccount } = usePortfolio();
      await expect(updateAccount(1, 'Updated Name')).rejects.toThrow('Update failed');
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

    it('should rethrow on delete account failure', async () => {
      const error = new Error('Delete failed');
      mockApiService.deleteAccount.mockRejectedValue(error);

      const { deleteAccount } = usePortfolio();
      await expect(deleteAccount(1)).rejects.toThrow('Delete failed');
    });
  });

  describe('createInstitution', () => {
    it('should create institution and reload portfolio', async () => {
      mockApiService.createInstitution.mockResolvedValue(undefined);
      mockApiService.getPortfolio.mockResolvedValue({ items: [] });
      mockApiService.getInstitutions.mockResolvedValue([]);

      const { createInstitution } = usePortfolio();
      await createInstitution('New Bank');

      expect(mockApiService.createInstitution).toHaveBeenCalledWith({ name: 'New Bank', parentId: null, institutionType: null });
    });

    it('should rethrow on create institution failure', async () => {
      const error = new Error('Create failed');
      mockApiService.createInstitution.mockRejectedValue(error);

      const { createInstitution } = usePortfolio();
      await expect(createInstitution('New Bank')).rejects.toThrow('Create failed');
    });
  });

  describe('updateInstitution', () => {
    it('should update institution and reload portfolio', async () => {
      mockApiService.updateInstitution.mockResolvedValue(undefined);
      mockApiService.getPortfolio.mockResolvedValue({ items: [] });
      mockApiService.getInstitutions.mockResolvedValue([]);

      const { updateInstitution } = usePortfolio();
      await updateInstitution(1, 'Updated Bank');

      expect(mockApiService.updateInstitution).toHaveBeenCalledWith(1, { name: 'Updated Bank', parentId: null, institutionType: null });
    });

    it('should rethrow on update institution failure', async () => {
      const error = new Error('Update failed');
      mockApiService.updateInstitution.mockRejectedValue(error);

      const { updateInstitution } = usePortfolio();
      await expect(updateInstitution(1, 'Updated Bank')).rejects.toThrow('Update failed');
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

    it('should rethrow on delete institution failure', async () => {
      const error = new Error('Delete failed');
      mockApiService.deleteInstitution.mockRejectedValue(error);

      const { deleteInstitution } = usePortfolio();
      await expect(deleteInstitution(1)).rejects.toThrow('Delete failed');
    });
  });

});