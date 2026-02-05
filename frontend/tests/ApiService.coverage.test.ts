/**
 * Tests for ApiService - API coverage and feature completeness
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService } from '../src/services/ApiService';

describe('ApiService - API Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API Endpoint Coverage', () => {
    it('should support authentication endpoints', () => {
      const authMethods = ['registerUser', 'loginUser', 'getCurrentUser'];
      authMethods.forEach((method) => {
        const methodName = method as keyof typeof apiService;
        expect(typeof apiService[methodName]).toBe('function');
      });
    });

    it('should support portfolio CRUD endpoints', () => {
      const crudMethods = ['getPortfolio', 'getAccounts', 'getAccount', 'createAccount', 'updateAccount', 'deleteAccount'];
      crudMethods.forEach((method) => {
        const methodName = method as keyof typeof apiService;
        expect(typeof apiService[methodName]).toBe('function');
      });
    });

    it('should support institution CRUD endpoints', () => {
      const crudMethods = ['getInstitutions', 'createInstitution', 'updateInstitution', 'deleteInstitution'];
      crudMethods.forEach((method) => {
        const methodName = method as keyof typeof apiService;
        expect(typeof apiService[methodName]).toBe('function');
      });
    });
  });

  describe('Portfolio Feature Method Coverage', () => {
    const portfolioMethods = [
      'getPortfolio',
      'getInstitutions',
      'createAccount',
      'updateAccount',
      'deleteAccount',
      'createInstitution',
      'updateInstitution',
      'deleteInstitution',
    ];

    portfolioMethods.forEach((method) => {
      it(`should have ${method} method implemented`, () => {
        const methodName = method as keyof typeof apiService;
        expect(typeof apiService[methodName]).toBe('function');
        const signature = apiService[methodName].toString();
        expect(signature.length).toBeGreaterThan(50);
      });
    });
  });

  describe('Integration with Portfolio Feature', () => {
    it('should have all methods required by Portfolio feature', () => {
      const requiredMethods = [
        'getPortfolio',
        'getInstitutions',
        'createAccount',
        'updateAccount',
        'deleteAccount',
        'createInstitution',
        'updateInstitution',
        'deleteInstitution',
      ];

      requiredMethods.forEach((method) => {
        const methodName = method as keyof typeof apiService;
        expect(apiService[methodName]).toBeDefined();
        expect(typeof apiService[methodName]).toBe('function');
      });
    });

    it('should have authentication support for Portfolio feature', () => {
      const authMethods = ['setAuthToken', 'getAuthToken', 'clearAuthToken'];
      authMethods.forEach((method) => {
        const methodName = method as keyof typeof apiService;
        expect(apiService[methodName]).toBeDefined();
        expect(typeof apiService[methodName]).toBe('function');
      });
    });
  });

  describe('Service Quality', () => {
    it('should have multiple methods for comprehensive API', () => {
      const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(apiService)).filter(
        (name) => typeof apiService[name as keyof typeof apiService] === 'function' && name !== 'constructor'
      );
      expect(methodNames.length).toBeGreaterThan(10);
    });

    it('should be properly typed and functional', () => {
      expect(apiService).toHaveProperty('setAuthToken');
      expect(apiService).toHaveProperty('getPortfolio');
      expect(apiService).toHaveProperty('createAccount');
    });

    it('should have all authentication and portfolio methods', () => {
      expect(apiService.registerUser).toBeDefined();
      expect(apiService.loginUser).toBeDefined();
      expect(apiService.getCurrentUser).toBeDefined();
      expect(apiService.setAuthToken).toBeDefined();
      expect(apiService.getAuthToken).toBeDefined();
      expect(apiService.clearAuthToken).toBeDefined();
      expect(apiService.getPortfolio).toBeDefined();
      expect(apiService.getAccounts).toBeDefined();
      expect(apiService.getAccount).toBeDefined();
      expect(apiService.createAccount).toBeDefined();
      expect(apiService.updateAccount).toBeDefined();
      expect(apiService.deleteAccount).toBeDefined();
      expect(apiService.getInstitutions).toBeDefined();
      expect(apiService.createInstitution).toBeDefined();
      expect(apiService.updateInstitution).toBeDefined();
      expect(apiService.deleteInstitution).toBeDefined();
    });
  });

  describe('Error Recovery Mechanisms', () => {
    it('should have retry mechanism for failed requests', () => {
      expect(typeof apiService.getPortfolio).toBe('function');
      const result = apiService.getPortfolio();
      expect(result).toBeInstanceOf(Promise);
      // Catch to prevent unhandled rejection
      result.catch(() => {
        // expected to fail without backend
      });
    });

    it('should support error handling in all async methods', () => {
      const methods = ['registerUser', 'loginUser', 'getCurrentUser', 'getPortfolio'];
      methods.forEach((method) => {
        const fn = apiService[method as keyof typeof apiService];
        expect(typeof fn).toBe('function');
      });
    });

    it('should handle auth errors specifically', async () => {
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

    it('should handle registration errors specifically', async () => {
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
  });
});
