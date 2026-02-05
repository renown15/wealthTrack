/**
 * Tests for PortfolioService
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

describe('PortfolioService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPortfolio', () => {
    it('should fetch portfolio from apiService', async () => {
      const mockPortfolio = {
        items: [
          {
            account: { id: 1, name: 'Savings', userid: 1, institutionid: 1, typeid: 1, statusid: 1, created_at: '', updated_at: '' },
            institution: { id: 1, name: 'Bank A', userid: 1, created_at: '', updated_at: '' },
            latest_balance: { id: 1, value: '1000.00', accountid: 1, userid: 1, eventtype: 'balance', created_at: '', updated_at: '' },
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

  describe('createAccount', () => {
    it('should create an account with provided data', async () => {
      const createData = { name: 'New Savings', institutionid: 1, typeid: 1 };
      const mockAccount = {
        id: 2,
        name: 'New Savings',
        userid: 1,
        institutionid: 1,
        typeid: 1,
        statusid: 1,
        created_at: '',
        updated_at: '',
      };
      mockApiService.createAccount.mockResolvedValue(mockAccount);

      const result = await portfolioService.createAccount(createData);

      expect(mockApiService.createAccount).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockAccount);
    });

    it('should pass through errors from apiService', async () => {
      const createData = { name: 'New Account', institutionid: 1, typeid: 1 };
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
        userid: 1,
        institutionid: 1,
        typeid: 1,
        statusid: 1,
        created_at: '',
        updated_at: '',
      };
      mockApiService.updateAccount.mockResolvedValue(mockAccount);

      const result = await portfolioService.updateAccount(accountId, updateData);

      expect(mockApiService.updateAccount).toHaveBeenCalledWith(accountId, updateData);
      expect(result).toEqual(mockAccount);
    });

    it('should handle update errors', async () => {
      const error = new Error('Account not found');
      mockApiService.updateAccount.mockRejectedValue(error);

      await expect(portfolioService.updateAccount(999, { name: 'Name' })).rejects.toThrow(
        'Account not found',
      );
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

      await expect(portfolioService.createInstitution({ name: 'Bank' })).rejects.toThrow(
        'Duplicate institution',
      );
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

      await expect(
        portfolioService.updateInstitution(999, { name: 'Name' }),
      ).rejects.toThrow('Institution not found');
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

      await expect(portfolioService.deleteInstitution(1)).rejects.toThrow(
        'Cannot delete institution',
      );
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
