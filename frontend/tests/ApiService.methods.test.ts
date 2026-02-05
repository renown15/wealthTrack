/**
 * Tests for ApiService - Method existence and availability
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService } from '../src/services/ApiService';

describe('ApiService - Method Availability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Auth Methods', () => {
    it('registerUser method exists and is callable', () => {
      expect(typeof apiService.registerUser).toBe('function');
    });

    it('registerUser returns a Promise', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };
      const result = apiService.registerUser(userData);
      expect(result).toBeInstanceOf(Promise);
      // Catch error to prevent unhandled rejection
      result.catch(() => {
        // expected to fail without backend
      });
    });

    it('loginUser method exists and is callable', () => {
      expect(typeof apiService.loginUser).toBe('function');
    });

    it('loginUser returns a Promise', async () => {
      const credentials = { email: 'test@example.com', password: 'password' };
      const result = apiService.loginUser(credentials);
      expect(result).toBeInstanceOf(Promise);
      // Catch error to prevent unhandled rejection
      result.catch(() => {
        // expected to fail without backend
      });
    });

    it('getCurrentUser method exists and is callable', () => {
      expect(typeof apiService.getCurrentUser).toBe('function');
    });

    it('getCurrentUser returns a Promise', async () => {
      const result = apiService.getCurrentUser();
      expect(result).toBeInstanceOf(Promise);
      // Catch error to prevent unhandled rejection
      result.catch(() => {
        // expected to fail without backend
      });
    });
  });

  describe('Portfolio Methods', () => {
    it('getPortfolio method exists and is callable', () => {
      expect(typeof apiService.getPortfolio).toBe('function');
    });

    it('getAccounts method exists and is callable', () => {
      expect(typeof apiService.getAccounts).toBe('function');
    });

    it('getAccount method exists and is callable', () => {
      expect(typeof apiService.getAccount).toBe('function');
    });

    it('createAccount method exists and is callable', () => {
      expect(typeof apiService.createAccount).toBe('function');
    });

    it('updateAccount method exists and is callable', () => {
      expect(typeof apiService.updateAccount).toBe('function');
    });

    it('deleteAccount method exists and is callable', () => {
      expect(typeof apiService.deleteAccount).toBe('function');
    });
  });

  describe('Institution Methods', () => {
    it('getInstitutions method exists and is callable', () => {
      expect(typeof apiService.getInstitutions).toBe('function');
    });

    it('createInstitution method exists and is callable', () => {
      expect(typeof apiService.createInstitution).toBe('function');
    });

    it('updateInstitution method exists and is callable', () => {
      expect(typeof apiService.updateInstitution).toBe('function');
    });

    it('deleteInstitution method exists and is callable', () => {
      expect(typeof apiService.deleteInstitution).toBe('function');
    });
  });

  describe('Service Initialization', () => {
    it('should be an object with expected methods', () => {
      expect(apiService).toBeDefined();
      expect(typeof apiService).toBe('object');
    });

    it('should have setAuthToken method', () => {
      expect(typeof apiService.setAuthToken).toBe('function');
    });

    it('should have clearAuthToken method', () => {
      expect(typeof apiService.clearAuthToken).toBe('function');
    });

    it('should have getAuthToken method', () => {
      expect(typeof apiService.getAuthToken).toBe('function');
    });
  });
});
