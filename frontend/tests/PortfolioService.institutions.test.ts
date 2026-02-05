/**
 * Tests for PortfolioService - Institution operations
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { portfolioService } from '../src/services/PortfolioService';
import * as ApiServiceModule from '../src/services/ApiService';

vi.mock('../src/services/ApiService', () => ({
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

const mockApiService = ApiServiceModule.apiService as any;

describe('PortfolioService - Institution Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInstitutions', () => {
    it('should fetch institutions from apiService', async () => {
      const mockInstitutions = [
        { id: 1, name: 'Bank A', userid: 1, created_at: '', updated_at: '' },
        { id: 2, name: 'Bank B', userid: 1, created_at: '', updated_at: '' },
      ];
      mockApiService.getInstitutions.mockResolvedValue(mockInstitutions);

      const result = await portfolioService.getInstitutions();

      expect(mockApiService.getInstitutions).toHaveBeenCalled();
      expect(result).toEqual(mockInstitutions);
    });

    it('should return empty array if no institutions', async () => {
      mockApiService.getInstitutions.mockResolvedValue([]);

      const result = await portfolioService.getInstitutions();

      expect(result).toEqual([]);
    });
  });

  describe('createInstitution', () => {
    it('should create an institution with provided name', async () => {
      const createData = { name: 'New Bank' };
      const mockInstitution = { id: 3, name: 'New Bank', userid: 1, created_at: '', updated_at: '' };
      mockApiService.createInstitution.mockResolvedValue(mockInstitution);

      const result = await portfolioService.createInstitution(createData);

      expect(mockApiService.createInstitution).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockInstitution);
    });

    it('should handle institution creation errors', async () => {
      const error = new Error('Duplicate institution');
      mockApiService.createInstitution.mockRejectedValue(error);

      await expect(portfolioService.createInstitution({ name: 'Bank' })).rejects.toThrow('Duplicate institution');
    });
  });

  describe('updateInstitution', () => {
    it('should update an institution with new name', async () => {
      const institutionId = 1;
      const updateData = { name: 'Updated Bank' };
      const mockInstitution = {
        id: 1,
        name: 'Updated Bank',
        userid: 1,
        created_at: '',
        updated_at: '',
      };
      mockApiService.updateInstitution.mockResolvedValue(mockInstitution);

      const result = await portfolioService.updateInstitution(institutionId, updateData);

      expect(mockApiService.updateInstitution).toHaveBeenCalledWith(institutionId, updateData);
      expect(result).toEqual(mockInstitution);
    });

    it('should handle update errors', async () => {
      const error = new Error('Institution not found');
      mockApiService.updateInstitution.mockRejectedValue(error);

      await expect(portfolioService.updateInstitution(999, { name: 'Name' })).rejects.toThrow('Institution not found');
    });
  });

  describe('deleteInstitution', () => {
    it('should delete an institution by id', async () => {
      const institutionId = 1;
      mockApiService.deleteInstitution.mockResolvedValue(undefined);

      await portfolioService.deleteInstitution(institutionId);

      expect(mockApiService.deleteInstitution).toHaveBeenCalledWith(institutionId);
    });

    it('should handle delete errors', async () => {
      const error = new Error('Cannot delete institution');
      mockApiService.deleteInstitution.mockRejectedValue(error);

      await expect(portfolioService.deleteInstitution(1)).rejects.toThrow('Cannot delete institution');
    });
  });
});
