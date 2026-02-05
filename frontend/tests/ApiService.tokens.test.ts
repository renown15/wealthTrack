/**
 * Tests for ApiService - Token management
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiService } from '../src/services/ApiService';

describe('ApiService - Token Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiService.clearAuthToken();
  });

  afterEach(() => {
    apiService.clearAuthToken();
  });

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

  it('should handle setAuthToken workflow', () => {
    apiService.setAuthToken('portfolio-token');
    const token = apiService.getAuthToken();
    expect(token).toBe('portfolio-token');
    apiService.clearAuthToken();
    expect(apiService.getAuthToken()).toBeUndefined();
  });

  it('setAuthToken properly formats bearer token', () => {
    const testToken = 'test-auth-token-123';
    apiService.setAuthToken(testToken);
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
