/**
 * Auth module tests - setToken, clearToken, and lifecycle operations
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the apiService BEFORE importing authModule
vi.mock('@services/ApiService', () => ({
  apiService: {
    setAuthToken: vi.fn(),
    clearAuthToken: vi.fn(),
  },
}));

import { authModule } from '@modules/auth';
import { apiService } from '@services/ApiService';

describe('authModule - lifecycle', () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Reset module state by reinitializing
    authModule.init();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('setToken()', () => {
    it('should set the token and mark as authenticated', () => {
      authModule.setToken('new-token');
      expect(authModule.getToken()).toBe('new-token');
      expect(authModule.isAuthenticated()).toBe(true);
    });

    it('should persist token to localStorage', () => {
      authModule.setToken('persistent-token');
      expect(localStorage.getItem('accessToken')).toBe('persistent-token');
    });

    it('should call apiService.setAuthToken with the token', () => {
      authModule.setToken('api-token');
      expect(apiService.setAuthToken).toHaveBeenCalledWith('api-token');
    });

    it('should update existing token', () => {
      authModule.setToken('first-token');
      expect(authModule.getToken()).toBe('first-token');
      authModule.setToken('second-token');
      expect(authModule.getToken()).toBe('second-token');
      expect(localStorage.getItem('accessToken')).toBe('second-token');
    });
  });

  describe('clearToken()', () => {
    it('should clear the token', () => {
      authModule.setToken('token-to-clear');
      authModule.clearToken();
      expect(authModule.getToken()).toBeNull();
    });

    it('should mark as not authenticated', () => {
      authModule.setToken('token');
      authModule.clearToken();
      expect(authModule.isAuthenticated()).toBe(false);
    });

    it('should remove token from localStorage', () => {
      authModule.setToken('token');
      authModule.clearToken();
      expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('should call apiService.clearAuthToken', () => {
      authModule.setToken('token');
      vi.clearAllMocks();
      authModule.clearToken();
      expect(apiService.clearAuthToken).toHaveBeenCalled();
    });

    it('should be safe to call when no token is set', () => {
      localStorage.clear();
      authModule.init();
      authModule.clearToken();
      expect(authModule.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('should clear even after multiple setToken calls', () => {
      authModule.setToken('token1');
      authModule.setToken('token2');
      authModule.setToken('token3');
      authModule.clearToken();
      expect(authModule.getToken()).toBeNull();
      expect(localStorage.getItem('accessToken')).toBeNull();
    });
  });

  describe('token lifecycle', () => {
    it('should complete full login/logout cycle', () => {
      // Initial state
      expect(authModule.isAuthenticated()).toBe(false);

      // Login
      authModule.setToken('login-token');
      expect(authModule.isAuthenticated()).toBe(true);
      expect(authModule.getToken()).toBe('login-token');

      // Logout
      authModule.clearToken();
      expect(authModule.isAuthenticated()).toBe(false);
      expect(authModule.getToken()).toBeNull();
    });

    it('should persist and restore token from localStorage', () => {
      // Set token
      authModule.setToken('persisted-token');
      expect(localStorage.getItem('accessToken')).toBe('persisted-token');

      // Simulate app restart by reinitializing
      authModule.init();
      expect(authModule.getToken()).toBe('persisted-token');
      expect(authModule.isAuthenticated()).toBe(true);
    });

    it('should handle rapid token changes', () => {
      authModule.setToken('token1');
      authModule.setToken('token2');
      authModule.setToken('token3');
      expect(authModule.getToken()).toBe('token3');
      expect(localStorage.getItem('accessToken')).toBe('token3');
    });
  });
});
