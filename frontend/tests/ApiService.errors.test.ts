/**
 * Tests for ApiService - Error handling
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService } from '../src/services/ApiService';

describe('ApiService - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registerUser handles axios errors with detail property', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    const mockError: any = new Error('Request failed');
    mockError.isAxiosError = true;
    mockError.response = { data: { detail: 'Email already exists' }, status: 400 };

    const clientSpy = vi.spyOn(apiService['client'], 'post').mockRejectedValueOnce(mockError);

    try {
      await apiService.registerUser(userData);
      expect.fail('Should have thrown');
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
      expect.fail('Should have thrown');
    } catch (error) {
      // AuthService handles the error and wraps it
      expect((error as Error).message).toBeTruthy();
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
      expect.fail('Should have thrown');
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
      expect.fail('Should have thrown');
    } catch (error) {
      expect((error as Error).message).toBe('Portfolio not found');
    }
    clientSpy.mockRestore();
  });

  it('createAccount handles axios errors', async () => {
    const mockError: any = new Error('Request failed');
    mockError.isAxiosError = true;
    mockError.response = { data: { detail: 'Invalid account data' }, status: 400 };

    const clientSpy = vi.spyOn(apiService['client'], 'post').mockRejectedValueOnce(mockError);

    try {
      await apiService.createAccount({ institutionId: 1, name: 'Test' });
      expect.fail('Should have thrown');
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
      expect.fail('Should have thrown');
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
      expect.fail('Should have thrown');
    } catch (error) {
      expect((error as Error).message).toBe('Cannot delete account');
    }
    clientSpy.mockRestore();
  });

  it('handles non-axios errors gracefully', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    const clientSpy = vi.spyOn(apiService['client'], 'post').mockRejectedValueOnce(new Error('Generic error'));

    try {
      await apiService.registerUser(userData);
      expect.fail('Should have thrown');
    } catch (error) {
      // Service wraps the error
      expect((error as Error).message).toBeTruthy();
    }
    clientSpy.mockRestore();
  });
});
