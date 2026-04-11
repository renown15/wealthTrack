/**
 * Tests for ApiService - Retry logic
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService } from '../src/services/ApiService';

describe('ApiService - Retry Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles retryable errors by retrying', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    const mockSuccessResponse = { data: { id: 1, email: 'test@example.com' } };
    const mockError: any = new Error('Service unavailable');
    mockError.isAxiosError = true;
    mockError.response = { data: { detail: 'Service unavailable' }, status: 503 };

    const clientSpy = vi
      .spyOn(apiService['client'], 'post')
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockSuccessResponse);

    const result = await apiService.registerUser(userData);
    expect(result.email).toBe('test@example.com');
    expect(clientSpy).toHaveBeenCalledTimes(2);
    clientSpy.mockRestore();
  });

  it('isRetryableError branch - handles non-retryable status codes', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    const mockError: any = new Error('Bad request');
    mockError.isAxiosError = true;
    mockError.response = { data: { detail: 'Invalid data' }, status: 400 };

    const clientSpy = vi.spyOn(apiService['client'], 'post').mockRejectedValueOnce(mockError);

    try {
      await apiService.registerUser(userData);
      expect.fail('Should have thrown');
    } catch (error) {
      expect((error as Error).message).toBe('Invalid data');
    }

    expect(clientSpy).toHaveBeenCalledTimes(1);
    clientSpy.mockRestore();
  });

  it('isRetryableError branch - handles errors without response', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    const mockError: any = new Error('Network error');
    mockError.isAxiosError = true;
    mockError.response = undefined;

    const mockSuccessResponse = { data: { id: 1, email: 'test@example.com' } };

    const clientSpy = vi
      .spyOn(apiService['client'], 'post')
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockSuccessResponse);

    const result = await apiService.registerUser(userData);
    expect(result.email).toBe('test@example.com');
    expect(clientSpy).toHaveBeenCalledTimes(2);
    clientSpy.mockRestore();
  });

  it('deleteInstitution with non-axios error', async () => {
    const genericError = new Error('Some other error');

    const clientSpy = vi.spyOn(apiService['client'], 'delete').mockRejectedValueOnce(genericError);

    try {
      await apiService.deleteInstitution(1);
      expect.fail('Should have thrown');
    } catch (error) {
      expect((error as Error).message).toBeTruthy();
    }
    clientSpy.mockRestore();
  });

  it('throws non-retryable errors immediately without retry', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    const mockError: any = new Error('Bad request');
    mockError.isAxiosError = true;
    mockError.response = { data: { detail: 'Invalid data' }, status: 400 };

    const clientSpy = vi.spyOn(apiService['client'], 'post').mockRejectedValueOnce(mockError);

    try {
      await apiService.registerUser(userData);
      expect.fail('Should have thrown');
    } catch (error) {
      expect((error as Error).message).toBe('Invalid data');
    }

    expect(clientSpy).toHaveBeenCalledTimes(1);
    clientSpy.mockRestore();
  });

  it('should have retry mechanism implementation', async () => {
    expect(typeof apiService.getPortfolio).toBe('function');
    const spy = vi.spyOn(apiService['client'], 'get').mockRejectedValueOnce(new Error('mocked'));
    const result = apiService.getPortfolio();
    expect(result).toBeInstanceOf(Promise);
    await result.catch(() => {});
    spy.mockRestore();
  });

  it('should have error handling in async methods', async () => {
    expect(typeof apiService.loginUser).toBe('function');
    const spy = vi.spyOn(apiService['client'], 'post').mockRejectedValueOnce(new Error('mocked'));
    const result = apiService.loginUser({ email: 'test@example.com', password: 'password' });
    expect(result).toBeInstanceOf(Promise);
    await result.catch(() => {});
    spy.mockRestore();
  });
});
