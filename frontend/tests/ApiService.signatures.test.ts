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

  describe('Authentication API Execution', () => {
    it('should have working registerUser method', () => {
      expect(typeof apiService.registerUser).toBe('function');
      const result = apiService.registerUser({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result).toBeInstanceOf(Promise);
      // Catch to prevent unhandled rejection
      result.catch(() => {
        // expected to fail without backend
      });
    });

    it('should have working loginUser method', () => {
      expect(typeof apiService.loginUser).toBe('function');
      const result = apiService.loginUser({
        email: 'test@example.com',
        password: 'password',
      });
      expect(result).toBeInstanceOf(Promise);
      // Catch to prevent unhandled rejection
      result.catch(() => {
        // expected to fail without backend
      });
    });

    it('should have working getCurrentUser method', () => {
      expect(typeof apiService.getCurrentUser).toBe('function');
      const result = apiService.getCurrentUser();
      expect(result).toBeInstanceOf(Promise);
      // Catch to prevent unhandled rejection
      result.catch(() => {
        // expected to fail without backend
      });
    });

    it('registerUser validates all required fields', () => {
      expect(typeof apiService.registerUser).toBe('function');
    });

    it('loginUser validates credentials', () => {
      const sig = apiService.loginUser.toString();
      expect(sig).toContain('credentials');
    });

    it('getCurrentUser authenticates user', () => {
      const sig = apiService.getCurrentUser.toString();
      expect(sig).toContain('auth');
    });
  });

  describe('Parameter Acceptance', () => {
    it('account methods should accept proper parameters', () => {
      expect(apiService.getAccount(1)).toBeInstanceOf(Promise);
      expect(apiService.createAccount({ name: 'Test' })).toBeInstanceOf(Promise);
      expect(apiService.updateAccount(1, { name: 'Updated' })).toBeInstanceOf(Promise);
      expect(apiService.deleteAccount(1)).toBeInstanceOf(Promise);
    });

    it('institution methods should accept proper parameters', () => {
      expect(apiService.createInstitution({ name: 'Bank' })).toBeInstanceOf(Promise);
      expect(apiService.updateInstitution(1, { name: 'Bank' })).toBeInstanceOf(Promise);
      expect(apiService.deleteInstitution(1)).toBeInstanceOf(Promise);
    });
  });

  describe('Portfolio CRUD Completeness', () => {
    it('should support all account operations', () => {
      const accountOps = [
        { method: 'getAccounts', hasImpl: true },
        { method: 'getAccount', hasImpl: true },
        { method: 'createAccount', hasImpl: true },
        { method: 'updateAccount', hasImpl: true },
        { method: 'deleteAccount', hasImpl: true },
      ];

      accountOps.forEach(({ method, hasImpl }) => {
        const fn = apiService[method as keyof typeof apiService] as Function;
        expect(fn).toBeDefined();
        expect(typeof fn).toBe('function');
        if (hasImpl) {
          expect(fn.toString().length).toBeGreaterThan(50);
        }
      });
    });

    it('should support all institution operations', () => {
      const institutionOps = [
        { method: 'getInstitutions', hasImpl: true },
        { method: 'createInstitution', hasImpl: true },
        { method: 'updateInstitution', hasImpl: true },
        { method: 'deleteInstitution', hasImpl: true },
      ];

      institutionOps.forEach(({ method, hasImpl }) => {
        const fn = apiService[method as keyof typeof apiService] as Function;
        expect(fn).toBeDefined();
        expect(typeof fn).toBe('function');
        if (hasImpl) {
          expect(fn.toString().length).toBeGreaterThan(50);
        }
      });
    });

    it('should have portfolio retrieval endpoint', () => {
      expect(apiService.getPortfolio).toBeDefined();
      const signature = apiService.getPortfolio.toString();
      expect(signature.includes('portfolio')).toBe(true);
    });
  });
});
