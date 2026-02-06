/**
 * Tests for PortfolioService - Account and portfolio operations
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

describe('PortfolioService - Account Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPortfolio', () => {
    it('should fetch portfolio from apiService', async () => {
      const mockPortfolio = {
        items: [
          {
            account: { id: 1, name: 'Savings', userId: 1, institutionId: 1, typeId: 1, statusId: 1, createdAt: '', updatedAt: '' },
            institution: { id: 1, name: 'Bank A', userId: 1, createdAt: '', updatedAt: '' },
            latestBalance: { id: 1, value: '1000.00', accountId: 1, userId: 1, eventType: 'balance', createdAt: '', updatedAt: '' },
          },
        ],
        totalValue: 1000,
        accountCount: 1,
      };
      mockApiService.getPortfolio.mockResolvedValue(mockPortfolio);

      const result = await portfolioService.getPortfolio();

      expect(mockApiService.getPortfolio).toHaveBeenCalled();
      expect(result).toEqual(mockPortfolio);
    });

    it('should handle portfolio fetch errors', async () => {
      const error = new Error('Network error');
      mockApiService.getPortfolio.mockRejectedValue(error);

      await expect(portfolioService.getPortfolio()).rejects.toThrow('Network error');
      expect(mockApiService.getPortfolio).toHaveBeenCalled();
    });
  });

  describe('createAccount', () => {
    it('should create an account with provided data', async () => {
      const createData = { name: 'New Savings', institutionId: 1, typeId: 1 };
      const mockAccount = {
        id: 2,
        name: 'New Savings',
        userId: 1,
        institutionId: 1,
        typeId: 1,
        statusId: 1,
        createdAt: '',
        updatedAt: '',
      };
      mockApiService.createAccount.mockResolvedValue(mockAccount);

      const result = await portfolioService.createAccount(createData);

      expect(mockApiService.createAccount).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockAccount);
    });

    it('should pass through errors from apiService', async () => {
      const createData = { name: 'New Account', institutionId: 1, typeId: 1 };
      const error = new Error('Duplicate account');
      mockApiService.createAccount.mockRejectedValue(error);

      await expect(portfolioService.createAccount(createData)).rejects.toThrow('Duplicate account');
    });
  });

  describe('updateAccount', () => {
    it('should update an account with new name', async () => {
      const accountId = 1;
      const updateData = { name: 'Updated Savings' };
      const mockAccount = {
        id: 1,
        name: 'Updated Savings',
        userId: 1,
        institutionId: 1,
        typeId: 1,
        statusId: 1,
        createdAt: '',
        updatedAt: '',
      };
      mockApiService.updateAccount.mockResolvedValue(mockAccount);

      const result = await portfolioService.updateAccount(accountId, updateData);

      expect(mockApiService.updateAccount).toHaveBeenCalledWith(accountId, updateData);
      expect(result).toEqual(mockAccount);
    });

    it('should handle update errors', async () => {
      const error = new Error('Account not found');
      mockApiService.updateAccount.mockRejectedValue(error);

      await expect(portfolioService.updateAccount(999, { name: 'Name' })).rejects.toThrow('Account not found');
    });
  });

  describe('deleteAccount', () => {
    it('should delete an account by id', async () => {
      const accountId = 1;
      mockApiService.deleteAccount.mockResolvedValue(undefined);

      await portfolioService.deleteAccount(accountId);

      expect(mockApiService.deleteAccount).toHaveBeenCalledWith(accountId);
    });

    it('should handle delete errors', async () => {
      const error = new Error('Cannot delete account');
      mockApiService.deleteAccount.mockRejectedValue(error);

      await expect(portfolioService.deleteAccount(1)).rejects.toThrow('Cannot delete account');
    });
  });

  describe('All portfolio operations', () => {
    it('should have all required methods', () => {
      expect(typeof portfolioService.getPortfolio).toBe('function');
      expect(typeof portfolioService.getInstitutions).toBe('function');
      expect(typeof portfolioService.createAccount).toBe('function');
      expect(typeof portfolioService.updateAccount).toBe('function');
      expect(typeof portfolioService.deleteAccount).toBe('function');
      expect(typeof portfolioService.createInstitution).toBe('function');
      expect(typeof portfolioService.updateInstitution).toBe('function');
      expect(typeof portfolioService.deleteInstitution).toBe('function');
    });
  });
});
