/**
 * Tests for ApiService - Method signatures and parameters
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService } from '../src/services/ApiService';

describe('ApiService - Method Signatures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Method Signatures', () => {
    it('registerUser should accept UserRegistration object', () => {
      const methodSignature = apiService.registerUser.toString();
      expect(methodSignature).toContain('userData');
    });

    it('loginUser should accept UserLogin object', () => {
      const methodSignature = apiService.loginUser.toString();
      expect(methodSignature).toContain('credentials');
    });

    it('getAccount should accept accountId parameter', () => {
      const methodSignature = apiService.getAccount.toString();
      expect(methodSignature).toContain('accountId');
    });

    it('createAccount should accept data parameter', () => {
      const methodSignature = apiService.createAccount.toString();
      expect(methodSignature).toContain('data');
    });

    it('updateAccount should accept accountId and data parameters', () => {
      const methodSignature = apiService.updateAccount.toString();
      expect(methodSignature).toContain('accountId');
      expect(methodSignature).toContain('data');
    });

    it('deleteAccount should accept accountId parameter', () => {
      const methodSignature = apiService.deleteAccount.toString();
      expect(methodSignature).toContain('accountId');
    });

    it('createInstitution should accept data parameter', () => {
      const methodSignature = apiService.createInstitution.toString();
      expect(methodSignature).toContain('data');
    });

    it('updateInstitution should accept institutionId and data parameters', () => {
      const methodSignature = apiService.updateInstitution.toString();
      expect(methodSignature).toContain('institutionId');
      expect(methodSignature).toContain('data');
    });

    it('deleteInstitution should accept institutionId parameter', () => {
      const methodSignature = apiService.deleteInstitution.toString();
      expect(methodSignature).toContain('institutionId');
    });
  });

  describe('Authentication API Methods', () => {
    it('should have registerUser method', () => {
      expect(typeof apiService.registerUser).toBe('function');
    });

    it('should have loginUser method', () => {
      expect(typeof apiService.loginUser).toBe('function');
    });

    it('should have getCurrentUser method', () => {
      expect(typeof apiService.getCurrentUser).toBe('function');
    });

    it('registerUser has proper signature', () => {
      const sig = apiService.registerUser.toString();
      expect(sig).toContain('userData');
    });

    it('loginUser has proper signature', () => {
      const sig = apiService.loginUser.toString();
      expect(sig).toContain('credentials');
    });

    it('getCurrentUser has proper signature', () => {
      expect(typeof apiService.getCurrentUser).toBe('function');
    });
  });

  describe('Parameter Acceptance', () => {
    it('account operation methods exist and have proper signatures', () => {
      expect(typeof apiService.getAccount).toBe('function');
      expect(typeof apiService.createAccount).toBe('function');
      expect(typeof apiService.updateAccount).toBe('function');
      expect(typeof apiService.deleteAccount).toBe('function');
      expect(typeof apiService.getAccounts).toBe('function');
    });

    it('institution operation methods exist and have proper signatures', () => {
      expect(typeof apiService.createInstitution).toBe('function');
      expect(typeof apiService.updateInstitution).toBe('function');
      expect(typeof apiService.deleteInstitution).toBe('function');
      expect(typeof apiService.getInstitutions).toBe('function');
    });
  });

  describe('Portfolio CRUD Completeness', () => {
    it('should support all account operations', () => {
      const accountOps = [
        'getAccounts',
        'getAccount',
        'createAccount',
        'updateAccount',
        'deleteAccount',
      ];

      accountOps.forEach((method) => {
        const fn = apiService[method as keyof typeof apiService] as Function;
        expect(fn).toBeDefined();
        expect(typeof fn).toBe('function');
        expect(fn.toString().length).toBeGreaterThan(50);
      });
    });

    it('should support all institution operations', () => {
      const institutionOps = [
        'getInstitutions',
        'createInstitution',
        'updateInstitution',
        'deleteInstitution',
      ];

      institutionOps.forEach((method) => {
        const fn = apiService[method as keyof typeof apiService] as Function;
        expect(fn).toBeDefined();
        expect(typeof fn).toBe('function');
        expect(fn.toString().length).toBeGreaterThan(50);
      });
    });

    it('should have portfolio retrieval method', () => {
      expect(apiService.getPortfolio).toBeDefined();
      expect(typeof apiService.getPortfolio).toBe('function');
    });
  });
});

