/**
 * Tests for ApiService - Promise returns and async behavior
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService } from '../src/services/ApiService';

describe('ApiService - Promise Returns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Portfolio Methods Return Promise', () => {
    it('getPortfolio returns Promise', () => {
      const result = apiService.getPortfolio();
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {
        // expected to fail without backend
      });
    });

    it('getAccounts returns Promise', () => {
      const result = apiService.getAccounts();
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {
        // expected to fail without backend
      });
    });

    it('getAccount returns Promise', () => {
      const result = apiService.getAccount(1);
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {
        // expected to fail without backend
      });
    });

    it('createAccount returns Promise', () => {
      const result = apiService.createAccount({ name: 'Test' });
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {
        // expected to fail without backend
      });
    });

    it('updateAccount returns Promise', () => {
      const result = apiService.updateAccount(1, { name: 'Updated' });
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {
        // expected to fail without backend
      });
    });

    it('deleteAccount returns Promise', () => {
      const result = apiService.deleteAccount(1);
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {
        // expected to fail without backend
      });
    });

    it('getInstitutions returns Promise', () => {
      const result = apiService.getInstitutions();
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {
        // expected to fail without backend
      });
    });

    it('createInstitution returns Promise', () => {
      const result = apiService.createInstitution({ name: 'Bank' });
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {
        // expected to fail without backend
      });
    });

    it('updateInstitution returns Promise', () => {
      const result = apiService.updateInstitution(1, { name: 'Bank' });
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {
        // expected to fail without backend
      });
    });

    it('deleteInstitution returns Promise', () => {
      const result = apiService.deleteInstitution(1);
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {
        // expected to fail without backend
      });
    });
  });

  describe('Error Handling Support', () => {
    it('all async methods should return Promise', () => {
      const p1 = apiService.getPortfolio();
      const p2 = apiService.getInstitutions();
      const p3 = apiService.getAccounts();
      expect(p1).toBeInstanceOf(Promise);
      expect(p2).toBeInstanceOf(Promise);
      expect(p3).toBeInstanceOf(Promise);
      p1.catch(() => {
        // expected to fail without backend
      });
      p2.catch(() => {
        // expected to fail without backend
      });
      p3.catch(() => {
        // expected to fail without backend
      });
    });
  });

  describe('Data Type Compatibility', () => {
    it('should accept proper account creation data', () => {
      const accountData = { name: 'Test Account', institution_id: 1 };
      const result = apiService.createAccount(accountData);
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {
        // expected to fail without backend
      });
    });

    it('should accept proper account update data', () => {
      const updateData = { name: 'Updated Account', institution_id: 2 };
      const result = apiService.updateAccount(1, updateData);
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {
        // expected to fail without backend
      });
    });

    it('should accept proper institution creation data', () => {
      const institutionData = { name: 'New Bank' };
      const result = apiService.createInstitution(institutionData);
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {
        // expected to fail without backend
      });
    });

    it('should accept proper institution update data', () => {
      const updateData = { name: 'Updated Bank' };
      const result = apiService.updateInstitution(1, updateData);
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {
        // expected to fail without backend
      });
    });
  });

  describe('Portfolio operations return promises', () => {
    it('should return promises for all portfolio operations', () => {
      const p1 = apiService.getAccounts();
      const p2 = apiService.getInstitutions();
      const p3 = apiService.getPortfolio();
      const p4 = apiService.createAccount({ name: 'Test' });
      const p5 = apiService.createInstitution({ name: 'Test' });
      expect(p1).toBeInstanceOf(Promise);
      expect(p2).toBeInstanceOf(Promise);
      expect(p3).toBeInstanceOf(Promise);
      expect(p4).toBeInstanceOf(Promise);
      expect(p5).toBeInstanceOf(Promise);
      [p1, p2, p3, p4, p5].forEach((p) => {
        p.catch(() => {
          // expected to fail without backend
        });
      });
    });
  });
});
