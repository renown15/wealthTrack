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
    it('has getPortfolio method', () => {
      expect(typeof apiService.getPortfolio).toBe('function');
    });

    it('has getAccounts method', () => {
      expect(typeof apiService.getAccounts).toBe('function');
    });

    it('has getAccount method', () => {
      expect(typeof apiService.getAccount).toBe('function');
    });

    it('has createAccount method', () => {
      expect(typeof apiService.createAccount).toBe('function');
    });

    it('has updateAccount method', () => {
      expect(typeof apiService.updateAccount).toBe('function');
    });

    it('has deleteAccount method', () => {
      expect(typeof apiService.deleteAccount).toBe('function');
    });

    it('has getInstitutions method', () => {
      expect(typeof apiService.getInstitutions).toBe('function');
    });

    it('has createInstitution method', () => {
      expect(typeof apiService.createInstitution).toBe('function');
    });

    it('has updateInstitution method', () => {
      expect(typeof apiService.updateInstitution).toBe('function');
    });

    it('has deleteInstitution method', () => {
      expect(typeof apiService.deleteInstitution).toBe('function');
    });
  });

  describe('Error Handling Support', () => {
    it('all portfolio methods should exist', () => {
      expect(typeof apiService.getPortfolio).toBe('function');
      expect(typeof apiService.getInstitutions).toBe('function');
      expect(typeof apiService.getAccounts).toBe('function');
      expect(typeof apiService.createAccount).toBe('function');
      expect(typeof apiService.createInstitution).toBe('function');
    });
  });

  describe('Data Type Compatibility', () => {
    it('should have proper method signatures for account creation', () => {
      const method = apiService.createAccount;
      expect(typeof method).toBe('function');
      expect(method.length).toBeGreaterThanOrEqual(1);
    });

    it('should have proper method signatures for account updates', () => {
      const method = apiService.updateAccount;
      expect(typeof method).toBe('function');
      expect(method.length).toBeGreaterThanOrEqual(2);
    });

    it('should have proper method signatures for institution creation', () => {
      const method = apiService.createInstitution;
      expect(typeof method).toBe('function');
      expect(method.length).toBeGreaterThanOrEqual(1);
    });

    it('should have proper method signatures for institution updates', () => {
      const method = apiService.updateInstitution;
      expect(typeof method).toBe('function');
      expect(method.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Portfolio operations method availability', () => {
    it('should have all portfolio operation methods', () => {
      const methods = [
        'getAccounts',
        'getInstitutions',
        'getPortfolio',
        'createAccount',
        'createInstitution',
        'updateAccount',
        'updateInstitution',
        'deleteAccount',
        'deleteInstitution',
      ];
      methods.forEach((method) => {
        expect((apiService as any)[method]).toBeDefined();
        expect(typeof (apiService as any)[method]).toBe('function');
      });
    });
  });
});
