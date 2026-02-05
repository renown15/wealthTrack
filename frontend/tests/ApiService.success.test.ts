/**
 * Tests for ApiService - Success cases
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService } from '../src/services/ApiService';

describe('ApiService - Success Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registerUser succeeds with valid data', async () => {
    const userData = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    const mockResponse = {
      data: { id: 1, email: 'new@example.com', firstName: 'John', lastName: 'Doe' },
    };

    const clientSpy = vi.spyOn(apiService['client'], 'post').mockResolvedValueOnce(mockResponse);
    const result = await apiService.registerUser(userData);
    expect(result.email).toBe('new@example.com');
    expect(clientSpy).toHaveBeenCalled();
    clientSpy.mockRestore();
  });

  it('loginUser succeeds with valid credentials', async () => {
    const credentials = { email: 'test@example.com', password: 'password' };
    const mockResponse = { data: { access_token: 'token123', token_type: 'bearer' } };

    const clientSpy = vi.spyOn(apiService['client'], 'post').mockResolvedValueOnce(mockResponse);
    const result = await apiService.loginUser(credentials);
    expect(result.access_token).toBe('token123');
    clientSpy.mockRestore();
  });

  it('getCurrentUser succeeds when authenticated', async () => {
    const mockResponse = {
      data: { id: 1, email: 'test@example.com', firstName: 'John', lastName: 'Doe' },
    };

    const clientSpy = vi.spyOn(apiService['client'], 'get').mockResolvedValueOnce(mockResponse);
    const result = await apiService.getCurrentUser();
    expect(result.email).toBe('test@example.com');
    clientSpy.mockRestore();
  });

  it('getPortfolio succeeds', async () => {
    const mockResponse = { data: { id: 1, totalValue: 50000, accounts: [] } };

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
    const result = await apiService.createAccount({ name: 'Test' });
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
    const mockResponse = { data: [{ id: 1, name: 'Bank A' }, { id: 2, name: 'Bank B' }] };

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
});
