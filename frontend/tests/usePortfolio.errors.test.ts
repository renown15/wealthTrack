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

  describe('error handling', () => {
    it('should handle Error object in createAccount', async () => {
      const mockError = new Error('Network error');
      const { state, createAccount } = usePortfolio();
      mockApiService.createAccount.mockRejectedValue(mockError);
      try {
        await createAccount(1, 'Test');
      } catch {}
      expect(state.error).toBe('Network error');
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
