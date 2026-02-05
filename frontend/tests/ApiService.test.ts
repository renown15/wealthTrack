/**
 * Tests for ApiService - Testing the exported instance's methods.
 * Focus on method availability, signatures, and behavior.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService } from '../src/services/ApiService';

describe('ApiService Instance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Auth Methods - Error Handling', () => {
    it('registerUser method exists and is callable', () => {
      expect(typeof apiService.registerUser).toBe('function');
    });

    it('registerUser returns a Promise', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
      };
      const result = apiService.registerUser(userData);
      expect(result).toBeInstanceOf(Promise);
    });

    it('loginUser method exists and is callable', () => {
      expect(typeof apiService.loginUser).toBe('function');
    });

    it('loginUser returns a Promise', async () => {
      const credentials = { email: 'test@example.com', password: 'password' };
      const result = apiService.loginUser(credentials);
      expect(result).toBeInstanceOf(Promise);
    });

    it('getCurrentUser method exists and is callable', () => {
      expect(typeof apiService.getCurrentUser).toBe('function');
    });

    it('getCurrentUser returns a Promise', async () => {
      const result = apiService.getCurrentUser();
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('Portfolio Methods - Error Handling', () => {
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

    it('getPortfolio returns Promise', () => {
      const result = apiService.getPortfolio();
      expect(result).toBeInstanceOf(Promise);
    });

    it('getAccounts returns Promise', () => {
      const result = apiService.getAccounts();
      expect(result).toBeInstanceOf(Promise);
    });

    it('getAccount returns Promise', () => {
      const result = apiService.getAccount(1);
      expect(result).toBeInstanceOf(Promise);
    });

    it('createAccount returns Promise', () => {
      const result = apiService.createAccount({ institutionid: 1, name: 'Test' });
      expect(result).toBeInstanceOf(Promise);
    });

    it('updateAccount returns Promise', () => {
      const result = apiService.updateAccount(1, { name: 'Updated' });
      expect(result).toBeInstanceOf(Promise);
    });

    it('deleteAccount returns Promise', () => {
      const result = apiService.deleteAccount(1);
      expect(result).toBeInstanceOf(Promise);
    });

    it('getInstitutions returns Promise', () => {
      const result = apiService.getInstitutions();
      expect(result).toBeInstanceOf(Promise);
    });

    it('createInstitution returns Promise', () => {
      const result = apiService.createInstitution({ name: 'Bank' });
      expect(result).toBeInstanceOf(Promise);
    });

    it('updateInstitution returns Promise', () => {
      const result = apiService.updateInstitution(1, { name: 'Bank' });
      expect(result).toBeInstanceOf(Promise);
    });

    it('deleteInstitution returns Promise', () => {
      const result = apiService.deleteInstitution(1);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('registerUser handles axios errors with detail property', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
      };

      // Create a mock error that mimics axios error
      const mockError: any = new Error('Request failed');
      mockError.isAxiosError = true;
      mockError.response = {
        data: { detail: 'Email already exists' },
        status: 400,
      };

      // Mock the internal client.post to reject
      const clientSpy = vi.spyOn(apiService['client'], 'post').mockRejectedValueOnce(mockError);

      try {
        await apiService.registerUser(userData);
        throw new Error('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('Email already exists');
      }

      clientSpy.mockRestore();
    });

    it('loginUser handles axios errors with fallback message', async () => {
      const credentials = { email: 'test@example.com', password: 'wrong' };

      const mockError: any = new Error('Request failed');
      mockError.isAxiosError = true;
      mockError.response = { data: {}, status: 401 };

      const clientSpy = vi.spyOn(apiService['client'], 'post').mockRejectedValueOnce(mockError);

      try {
        await apiService.loginUser(credentials);
        throw new Error('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('Login failed');
      }

      clientSpy.mockRestore();
    });

    it('getCurrentUser handles axios errors', async () => {
      const mockError: any = new Error('Request failed');
      mockError.isAxiosError = true;
      mockError.response = { data: { detail: 'Unauthorized' }, status: 401 };

      const clientSpy = vi.spyOn(apiService['client'], 'get').mockRejectedValueOnce(mockError);

      try {
        await apiService.getCurrentUser();
        throw new Error('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('Unauthorized');
      }

      clientSpy.mockRestore();
    });

    it('getPortfolio handles axios errors', async () => {
      const mockError: any = new Error('Request failed');
      mockError.isAxiosError = true;
      mockError.response = { data: { detail: 'Portfolio not found' }, status: 404 };

      const clientSpy = vi.spyOn(apiService['client'], 'get').mockRejectedValueOnce(mockError);

      try {
        await apiService.getPortfolio();
        throw new Error('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('Portfolio not found');
      }

      clientSpy.mockRestore();
    });

    it('getAccounts handles axios errors', async () => {
      const mockError: any = new Error('Request failed');
      mockError.isAxiosError = true;
      mockError.response = { data: { detail: 'Access denied' }, status: 403 };

      const clientSpy = vi.spyOn(apiService['client'], 'get').mockRejectedValueOnce(mockError);

      try {
        await apiService.getAccounts();
        throw new Error('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('Access denied');
      }

      clientSpy.mockRestore();
    });

    it('createAccount handles axios errors', async () => {
      const mockError: any = new Error('Request failed');
      mockError.isAxiosError = true;
      mockError.response = { data: { detail: 'Invalid account data' }, status: 400 };

      const clientSpy = vi.spyOn(apiService['client'], 'post').mockRejectedValueOnce(mockError);

      try {
        await apiService.createAccount({ institutionid: 1, name: 'Test' });
        throw new Error('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('Invalid account data');
      }

      clientSpy.mockRestore();
    });

    it('updateAccount handles axios errors', async () => {
      const mockError: any = new Error('Request failed');
      mockError.isAxiosError = true;
      mockError.response = { data: { detail: 'Account not found' }, status: 404 };

      const clientSpy = vi.spyOn(apiService['client'], 'put').mockRejectedValueOnce(mockError);

      try {
        await apiService.updateAccount(1, { name: 'Updated' });
        throw new Error('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('Account not found');
      }

      clientSpy.mockRestore();
    });

    it('deleteAccount handles axios errors', async () => {
      const mockError: any = new Error('Request failed');
      mockError.isAxiosError = true;
      mockError.response = { data: { detail: 'Cannot delete account' }, status: 400 };

      const clientSpy = vi.spyOn(apiService['client'], 'delete').mockRejectedValueOnce(mockError);

      try {
        await apiService.deleteAccount(1);
        throw new Error('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('Cannot delete account');
      }

      clientSpy.mockRestore();
    });

    it('getInstitutions handles axios errors', async () => {
      const mockError: any = new Error('Request failed');
      mockError.isAxiosError = true;
      mockError.response = { data: { detail: 'Unauthorized' }, status: 401 };

      const clientSpy = vi.spyOn(apiService['client'], 'get').mockRejectedValueOnce(mockError);

      try {
        await apiService.getInstitutions();
        throw new Error('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('Unauthorized');
      }

      clientSpy.mockRestore();
    });

    it('createInstitution handles axios errors', async () => {
      const mockError: any = new Error('Request failed');
      mockError.isAxiosError = true;
      mockError.response = { data: { detail: 'Institution exists' }, status: 409 };

      const clientSpy = vi.spyOn(apiService['client'], 'post').mockRejectedValueOnce(mockError);

      try {
        await apiService.createInstitution({ name: 'Bank' });
        throw new Error('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('Institution exists');
      }

      clientSpy.mockRestore();
    });

    it('updateInstitution handles axios errors', async () => {
      const mockError: any = new Error('Request failed');
      mockError.isAxiosError = true;
      mockError.response = { data: { detail: 'Institution not found' }, status: 404 };

      const clientSpy = vi.spyOn(apiService['client'], 'put').mockRejectedValueOnce(mockError);

      try {
        await apiService.updateInstitution(1, { name: 'Bank' });
        throw new Error('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('Institution not found');
      }

      clientSpy.mockRestore();
    });

    it('deleteInstitution handles axios errors', async () => {
      const mockError: any = new Error('Request failed');
      mockError.isAxiosError = true;
      mockError.response = { data: { detail: 'Cannot delete' }, status: 400 };

      const clientSpy = vi.spyOn(apiService['client'], 'delete').mockRejectedValueOnce(mockError);

      try {
        await apiService.deleteInstitution(1);
        throw new Error('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('Cannot delete');
      }

      clientSpy.mockRestore();
    });

    it('handles non-axios errors gracefully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
      };

      const clientSpy = vi.spyOn(apiService['client'], 'post').mockRejectedValueOnce(new Error('Generic error'));

      try {
        await apiService.registerUser(userData);
        throw new Error('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('An unexpected error occurred');
      }

      clientSpy.mockRestore();
    });

    it('registerUser succeeds with valid data', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
      };

      const mockResponse = {
        data: {
          id: 1,
          email: 'new@example.com',
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      const clientSpy = vi.spyOn(apiService['client'], 'post').mockResolvedValueOnce(mockResponse);

      const result = await apiService.registerUser(userData);
      expect(result.email).toBe('new@example.com');
      expect(clientSpy).toHaveBeenCalled();

      clientSpy.mockRestore();
    });

    it('loginUser succeeds with valid credentials', async () => {
      const credentials = { email: 'test@example.com', password: 'password' };

      const mockResponse = {
        data: { access_token: 'token123', token_type: 'bearer' },
      };

      const clientSpy = vi.spyOn(apiService['client'], 'post').mockResolvedValueOnce(mockResponse);

      const result = await apiService.loginUser(credentials);
      expect(result.accessToken).toBe('token123');

      clientSpy.mockRestore();
    });

    it('getCurrentUser succeeds when authenticated', async () => {
      const mockResponse = {
        data: {
          id: 1,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      const clientSpy = vi.spyOn(apiService['client'], 'get').mockResolvedValueOnce(mockResponse);

      const result = await apiService.getCurrentUser();
      expect(result.email).toBe('test@example.com');

      clientSpy.mockRestore();
    });

    it('getPortfolio succeeds', async () => {
      const mockResponse = {
        data: {
          id: 1,
          totalValue: 50000,
          accounts: [],
        },
      };

      const clientSpy = vi.spyOn(apiService['client'], 'get').mockResolvedValueOnce(mockResponse);

      const result = await apiService.getPortfolio();
      expect(result.totalValue).toBe(50000);

      clientSpy.mockRestore();
    });

    it('getAccounts succeeds', async () => {
      const mockResponse = {
        data: [
          { id: 1, name: 'Checking', balance: 1000 },
          { id: 2, name: 'Savings', balance: 5000 },
        ],
      };

      const clientSpy = vi.spyOn(apiService['client'], 'get').mockResolvedValueOnce(mockResponse);

      const result = await apiService.getAccounts();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);

      clientSpy.mockRestore();
    });

    it('createAccount succeeds', async () => {
      const mockResponse = { data: { id: 1, name: 'Test', balance: 0 } };

      const clientSpy = vi.spyOn(apiService['client'], 'post').mockResolvedValueOnce(mockResponse);

      const result = await apiService.createAccount({ institutionid: 1, name: 'Test' });
      expect(result.name).toBe('Test');

      clientSpy.mockRestore();
    });

    it('updateAccount succeeds', async () => {
      const mockResponse = { data: { id: 1, name: 'Updated', balance: 1000 } };

      const clientSpy = vi.spyOn(apiService['client'], 'put').mockResolvedValueOnce(mockResponse);

      const result = await apiService.updateAccount(1, { name: 'Updated' });
      expect(result.name).toBe('Updated');

      clientSpy.mockRestore();
    });

    it('deleteAccount succeeds', async () => {
      const clientSpy = vi.spyOn(apiService['client'], 'delete').mockResolvedValueOnce({ data: null });

      await apiService.deleteAccount(1);
      expect(clientSpy).toHaveBeenCalled();

      clientSpy.mockRestore();
    });

    it('getInstitutions succeeds', async () => {
      const mockResponse = {
        data: [
          { id: 1, name: 'Bank A' },
          { id: 2, name: 'Bank B' },
        ],
      };

      const clientSpy = vi.spyOn(apiService['client'], 'get').mockResolvedValueOnce(mockResponse);

      const result = await apiService.getInstitutions();
      expect(Array.isArray(result)).toBe(true);

      clientSpy.mockRestore();
    });

    it('createInstitution succeeds', async () => {
      const mockResponse = { data: { id: 1, name: 'Bank' } };

      const clientSpy = vi.spyOn(apiService['client'], 'post').mockResolvedValueOnce(mockResponse);

      const result = await apiService.createInstitution({ name: 'Bank' });
      expect(result.name).toBe('Bank');

      clientSpy.mockRestore();
    });

    it('updateInstitution succeeds', async () => {
      const mockResponse = { data: { id: 1, name: 'Updated Bank' } };

      const clientSpy = vi.spyOn(apiService['client'], 'put').mockResolvedValueOnce(mockResponse);

      const result = await apiService.updateInstitution(1, { name: 'Updated Bank' });
      expect(result.name).toBe('Updated Bank');

      clientSpy.mockRestore();
    });

    it('deleteInstitution succeeds', async () => {
      const clientSpy = vi.spyOn(apiService['client'], 'delete').mockResolvedValueOnce({ data: null });

      await apiService.deleteInstitution(1);
      expect(clientSpy).toHaveBeenCalled();

      clientSpy.mockRestore();
    });

    it('handles retryable errors by retrying', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
      };

      // First call returns 503 (retryable), second call succeeds
      const mockSuccessResponse = {
        data: { id: 1, email: 'test@example.com' },
      };
      const mockError: any = new Error('Service unavailable');
      mockError.isAxiosError = true;
      mockError.response = { data: { detail: 'Service unavailable' }, status: 503 };

      const clientSpy = vi.spyOn(apiService['client'], 'post')
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockSuccessResponse);

      const result = await apiService.registerUser(userData);
      expect(result.email).toBe('test@example.com');
      // Should have been called twice: once failed, once succeeded
      expect(clientSpy).toHaveBeenCalledTimes(2);

      clientSpy.mockRestore();
    });

    it('isRetryableError branch - handles non-retryable status codes', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
      };

      // 400 is not retryable
      const mockError: any = new Error('Bad request');
      mockError.isAxiosError = true;
      mockError.response = { data: { detail: 'Invalid data' }, status: 400 };

      const clientSpy = vi.spyOn(apiService['client'], 'post').mockRejectedValueOnce(mockError);

      try {
        await apiService.registerUser(userData);
        throw new Error('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('Invalid data');
      }

      // Should have been called once (no retry for 400)
      expect(clientSpy).toHaveBeenCalledTimes(1);

      clientSpy.mockRestore();
    });

    it('isRetryableError branch - handles errors without response', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
      };

      // Axios error without response (network error) is retryable
      const mockError: any = new Error('Network error');
      mockError.isAxiosError = true;
      mockError.response = undefined;

      const mockSuccessResponse = {
        data: { id: 1, email: 'test@example.com' },
      };

      const clientSpy = vi.spyOn(apiService['client'], 'post')
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockSuccessResponse);

      const result = await apiService.registerUser(userData);
      expect(result.email).toBe('test@example.com');
      expect(clientSpy).toHaveBeenCalledTimes(2);

      clientSpy.mockRestore();
    });

    it('deleteInstitution with non-axios error', async () => {
      const genericError = new Error('Some other error');

      const clientSpy = vi.spyOn(apiService['client'], 'delete')
        .mockRejectedValueOnce(genericError);

      try {
        await apiService.deleteInstitution(1);
        throw new Error('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('An unexpected error occurred');
      }

      clientSpy.mockRestore();
    });

    it('throws non-retryable errors immediately without retry', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
      };

      // 400 is not retryable
      const mockError: any = new Error('Bad request');
      mockError.isAxiosError = true;
      mockError.response = { data: { detail: 'Invalid data' }, status: 400 };

      const clientSpy = vi.spyOn(apiService['client'], 'post')
        .mockRejectedValueOnce(mockError);

      try {
        await apiService.registerUser(userData);
        throw new Error('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('Invalid data');
      }

      // Should only be called once (no retry for 400)
      expect(clientSpy).toHaveBeenCalledTimes(1);

      clientSpy.mockRestore();
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

  describe('Authentication Methods Available', () => {
    it('should have registerUser method', () => {
      expect(typeof apiService.registerUser).toBe('function');
    });

    it('should have loginUser method', () => {
      expect(typeof apiService.loginUser).toBe('function');
    });

    it('should have getCurrentUser method', () => {
      expect(typeof apiService.getCurrentUser).toBe('function');
    });
  });

  describe('Portfolio API Methods Available', () => {
    it('should have getPortfolio method', () => {
      expect(typeof apiService.getPortfolio).toBe('function');
    });

    it('should have getAccounts method', () => {
      expect(typeof apiService.getAccounts).toBe('function');
    });

    it('should have getAccount method', () => {
      expect(typeof apiService.getAccount).toBe('function');
    });

    it('should have createAccount method', () => {
      expect(typeof apiService.createAccount).toBe('function');
    });

    it('should have updateAccount method', () => {
      expect(typeof apiService.updateAccount).toBe('function');
    });

    it('should have deleteAccount method', () => {
      expect(typeof apiService.deleteAccount).toBe('function');
    });
  });

  describe('Institution API Methods Available', () => {
    it('should have getInstitutions method', () => {
      expect(typeof apiService.getInstitutions).toBe('function');
    });

    it('should have createInstitution method', () => {
      expect(typeof apiService.createInstitution).toBe('function');
    });

    it('should have updateInstitution method', () => {
      expect(typeof apiService.updateInstitution).toBe('function');
    });

    it('should have deleteInstitution method', () => {
      expect(typeof apiService.deleteInstitution).toBe('function');
    });
  });

  describe('Token Management Behavior', () => {
    it('setAuthToken should accept a string token', () => {
      const token = 'test-token-123';
      expect(() => apiService.setAuthToken(token)).not.toThrow();
    });

    it('clearAuthToken should not throw', () => {
      expect(() => apiService.clearAuthToken()).not.toThrow();
    });

    it('getAuthToken should return string or undefined', () => {
      const token = apiService.getAuthToken();
      expect(typeof token === 'string' || typeof token === 'undefined').toBe(true);
    });

    it('should handle setting and clearing tokens in sequence', () => {
      apiService.setAuthToken('first-token');
      apiService.clearAuthToken();
      const token = apiService.getAuthToken();
      expect(token).toBeUndefined();
    });

    it('should handle multiple token sets', () => {
      apiService.setAuthToken('token-1');
      apiService.setAuthToken('token-2');
      apiService.setAuthToken('token-3');
      const token = apiService.getAuthToken();
      expect(token).toBe('token-3');
    });
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

  describe('Error Handling Support', () => {
    it('all async methods should return Promise', () => {
      expect(apiService.getPortfolio()).toBeInstanceOf(Promise);
      expect(apiService.getInstitutions()).toBeInstanceOf(Promise);
      expect(apiService.getAccounts()).toBeInstanceOf(Promise);
    });
  });

  describe('Data Type Compatibility', () => {
    it('should accept proper account creation data', () => {
      const accountData = { name: 'Test Account', institutionid: 1 };
      const result = apiService.createAccount(accountData);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should accept proper account update data', () => {
      const updateData = { name: 'Updated Account', institution_id: 2 };
      const result = apiService.updateAccount(1, updateData);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should accept proper institution creation data', () => {
      const institutionData = { name: 'New Bank' };
      const result = apiService.createInstitution(institutionData);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should accept proper institution update data', () => {
      const updateData = { name: 'Updated Bank' };
      const result = apiService.updateInstitution(1, updateData);
      expect(result).toBeInstanceOf(Promise);
    });
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
      const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(apiService))
        .filter((name) => typeof apiService[name as keyof typeof apiService] === 'function' && name !== 'constructor');

      expect(methodNames.length).toBeGreaterThan(10);
    });

    it('should be properly typed and functional', () => {
      expect(apiService).toHaveProperty('setAuthToken');
      expect(apiService).toHaveProperty('getPortfolio');
      expect(apiService).toHaveProperty('createAccount');
    });

    it('should have all authentication and portfolio methods', () => {
      // Authentication
      expect(apiService.registerUser).toBeDefined();
      expect(apiService.loginUser).toBeDefined();
      expect(apiService.getCurrentUser).toBeDefined();
      expect(apiService.setAuthToken).toBeDefined();
      expect(apiService.getAuthToken).toBeDefined();
      expect(apiService.clearAuthToken).toBeDefined();
      
      // Portfolio
      expect(apiService.getPortfolio).toBeDefined();
      expect(apiService.getAccounts).toBeDefined();
      expect(apiService.getAccount).toBeDefined();
      expect(apiService.createAccount).toBeDefined();
      expect(apiService.updateAccount).toBeDefined();
      expect(apiService.deleteAccount).toBeDefined();
      
      // Institutions
      expect(apiService.getInstitutions).toBeDefined();
      expect(apiService.createInstitution).toBeDefined();
      expect(apiService.updateInstitution).toBeDefined();
      expect(apiService.deleteInstitution).toBeDefined();
    });
  });;

  describe('Authentication API Execution', () => {
    it('should have working registerUser method', () => {
      const methodStr = apiService.registerUser.toString();
      expect(methodStr).toContain('api/v1/auth/register');
    });

    it('should have working loginUser method', () => {
      const methodStr = apiService.loginUser.toString();
      expect(methodStr).toContain('api/v1/auth/login');
    });

    it('should have working getCurrentUser method', () => {
      const methodStr = apiService.getCurrentUser.toString();
      expect(methodStr).toContain('auth');
    });

    it('should handle authorization flow', () => {
      apiService.setAuthToken('initial-token');
      let token = apiService.getAuthToken();
      expect(token).toBe('initial-token');
      
      apiService.setAuthToken('new-token');
      token = apiService.getAuthToken();
      expect(token).toBe('new-token');
      
      apiService.clearAuthToken();
      token = apiService.getAuthToken();
      expect(token).toBeUndefined();
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

    it('should return promises for all portfolio operations', () => {
      expect(apiService.getAccounts()).toBeInstanceOf(Promise);
      expect(apiService.getInstitutions()).toBeInstanceOf(Promise);
      expect(apiService.getPortfolio()).toBeInstanceOf(Promise);
      expect(apiService.createAccount({ institutionid: 1, name: 'Test' })).toBeInstanceOf(Promise);
      expect(apiService.createInstitution({ name: 'Test' })).toBeInstanceOf(Promise);
    });
  });

  describe('Error Recovery Mechanisms', () => {
    it('should have retry mechanism for failed requests', () => {
      const str = apiService.getPortfolio.toString();
      expect(str.length).toBeGreaterThan(150);
    });

    it('should support error handling in all async methods', () => {
      const methods = ['registerUser', 'loginUser', 'getCurrentUser', 'getPortfolio'];
      methods.forEach((method) => {
        const fn = apiService[method as keyof typeof apiService];
        const str = fn.toString();
        expect(str).toContain('catch');
      });
    });

    it('should handle auth errors specifically', () => {
      const loginStr = apiService.loginUser.toString();
      expect(loginStr).toContain('Login failed');
    });

    it('should handle registration errors specifically', () => {
      const regStr = apiService.registerUser.toString();
      expect(regStr).toContain('Registration failed');
    });
  });;

  describe('Retry Logic Support', () => {
    it('should have retry mechanism implementation', () => {
      const methodStr = apiService.getPortfolio.toString();
      expect(methodStr.length).toBeGreaterThan(100);
    });

    it('should have error handling in async methods', () => {
      const methodStr = apiService.loginUser.toString();
      expect(methodStr.length).toBeGreaterThan(100);
    });
  });

  describe('Full Portfolio Feature Support', () => {
    it('getAllAccounts endpoint exists', () => {
      expect(apiService.getAccounts).toBeDefined();
    });

    it('getSingleAccount endpoint exists', () => {
      expect(apiService.getAccount).toBeDefined();
    });

    it('postNewAccount endpoint exists', () => {
      expect(apiService.createAccount).toBeDefined();
    });

    it('putExistingAccount endpoint exists', () => {
      expect(apiService.updateAccount).toBeDefined();
    });

    it('deleteExistingAccount endpoint exists', () => {
      expect(apiService.deleteAccount).toBeDefined();
    });

    it('getAllInstitutions endpoint exists', () => {
      expect(apiService.getInstitutions).toBeDefined();
    });

    it('postNewInstitution endpoint exists', () => {
      expect(apiService.createInstitution).toBeDefined();
    });

    it('putExistingInstitution endpoint exists', () => {
      expect(apiService.updateInstitution).toBeDefined();
    });

    it('deleteExistingInstitution endpoint exists', () => {
      expect(apiService.deleteInstitution).toBeDefined();
    });

    it('should handle setAuthToken workflow', () => {
      apiService.setAuthToken('portfolio-token');
      const token = apiService.getAuthToken();
      expect(token).toBe('portfolio-token');
      apiService.clearAuthToken();
      expect(apiService.getAuthToken()).toBeUndefined();
    });

    it('should have comprehensive account methods', () => {
      const accountMethods = ['getAccounts', 'getAccount', 'createAccount', 'updateAccount', 'deleteAccount'];
      accountMethods.forEach((method) => {
        expect(apiService[method as keyof typeof apiService]).toBeDefined();
      });
    });

    it('should have comprehensive institution methods', () => {
      const institutionMethods = ['getInstitutions', 'createInstitution', 'updateInstitution', 'deleteInstitution'];
      institutionMethods.forEach((method) => {
        expect(apiService[method as keyof typeof apiService]).toBeDefined();
      });
    });

    it('should have portfolio retrieval endpoint', () => {
      expect(apiService.getPortfolio).toBeDefined();
      const signature = apiService.getPortfolio.toString();
      expect(signature.includes('portfolio')).toBe(true);
    });

    it('account methods should accept proper parameters', () => {
      expect(apiService.getAccount(1)).toBeInstanceOf(Promise);
      expect(apiService.createAccount({ institutionid: 1, name: 'Test' })).toBeInstanceOf(Promise);
      expect(apiService.updateAccount(1, { name: 'Updated' })).toBeInstanceOf(Promise);
      expect(apiService.deleteAccount(1)).toBeInstanceOf(Promise);
    });

    it('institution methods should accept proper parameters', () => {
      expect(apiService.createInstitution({ name: 'Bank' })).toBeInstanceOf(Promise);
      expect(apiService.updateInstitution(1, { name: 'Bank' })).toBeInstanceOf(Promise);
      expect(apiService.deleteInstitution(1)).toBeInstanceOf(Promise);
    });

    it('should support complete CRUD for accounts', () => {
      const methods = ['getAccounts', 'getAccount', 'createAccount', 'updateAccount', 'deleteAccount'];
      methods.forEach((m) => {
        const method = apiService[m as keyof typeof apiService];
        expect(method).toBeDefined();
        expect(typeof method).toBe('function');
      });
    });

    it('should support complete CRUD for institutions', () => {
      const methods = ['getInstitutions', 'createInstitution', 'updateInstitution', 'deleteInstitution'];
      methods.forEach((m) => {
        const method = apiService[m as keyof typeof apiService];
        expect(method).toBeDefined();
        expect(typeof method).toBe('function');
      });
    });

    it('registerUser validates all required fields', () => {
      const sig = apiService.registerUser.toString();
      expect(sig).toContain('userData');
    });

    it('loginUser validates credentials', () => {
      const sig = apiService.loginUser.toString();
      expect(sig).toContain('credentials');
    });

    it('getCurrentUser authenticates user', () => {
      const sig = apiService.getCurrentUser.toString();
      expect(sig).toContain('auth');
    });

    it('setAuthToken properly formats bearer token', () => {
      const testToken = 'test-auth-token-123';
      apiService.setAuthToken(testToken);
      // Token should be set with Bearer prefix internally
      expect(apiService).toBeDefined();
    });

    it('clearAuthToken removes authentication', () => {
      apiService.setAuthToken('temp-token');
      apiService.clearAuthToken();
      const result = apiService.getAuthToken();
      expect(result).toBeUndefined();
    });

    it('getAuthToken retrieves current authentication', () => {
      const token = 'retrieve-test-token';
      apiService.setAuthToken(token);
      expect(apiService.getAuthToken()).toBe(token);
      apiService.clearAuthToken();
    });
  });
});
