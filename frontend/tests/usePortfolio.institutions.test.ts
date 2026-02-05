/**
 * Tests for usePortfolio composable - Institution operations
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

describe('usePortfolio - Institution Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
