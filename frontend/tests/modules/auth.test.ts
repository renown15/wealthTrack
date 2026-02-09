/**
 * Auth module tests - init, getToken, and isAuthenticated
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

describe('authModule', () => {
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

  describe('init()', () => {
    it('should initialize with no saved token', () => {
      // Clear any existing token
      localStorage.clear();
      authModule.init();
      expect(authModule.getToken()).toBeNull();
      expect(authModule.isAuthenticated()).toBe(false);
    });

    it('should initialize with saved token from localStorage', () => {
      // Set a token in localStorage before init
      localStorage.setItem('accessToken', 'saved-token-123');
      authModule.init();
      expect(authModule.getToken()).toBe('saved-token-123');
      expect(authModule.isAuthenticated()).toBe(true);
    });

    it('should call apiService.setAuthToken when saved token exists', () => {
      localStorage.setItem('accessToken', 'existing-token');
      vi.clearAllMocks();
      authModule.init();
      expect(apiService.setAuthToken).toHaveBeenCalledWith('existing-token');
    });
  });

  describe('isAuthenticated()', () => {
    it('should return false when no token is set', () => {
      // Clear auth state by clearing token
      authModule.clearToken();
      expect(authModule.isAuthenticated()).toBe(false);
    });

    it('should return true when token is set', () => {
      authModule.setToken('test-token');
      expect(authModule.isAuthenticated()).toBe(true);
    });

    it('should return false when token is cleared', () => {
      authModule.setToken('test-token');
      authModule.clearToken();
      expect(authModule.isAuthenticated()).toBe(false);
    });
  });

  describe('getToken()', () => {
    it('should return null when no token is set', () => {
      localStorage.clear();
      authModule.init();
      expect(authModule.getToken()).toBeNull();
    });

    it('should return the current token', () => {
      authModule.setToken('my-token');
      expect(authModule.getToken()).toBe('my-token');
    });

    it('should return null after clearing token', () => {
      authModule.setToken('my-token');
      authModule.clearToken();
      expect(authModule.getToken()).toBeNull();
    });

    it('should return the token even if not checking isAuthenticated', () => {
      // Test that getToken returns value independently of any other state
      const token = 'independent-token';
      authModule.setToken(token);
      const retrieved = authModule.getToken();
      expect(retrieved).toBe(token);
    });
  });
});
