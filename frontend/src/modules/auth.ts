/**
 * Auth state management - single source of truth for authentication
 */
import { apiService } from '@services/ApiService';

interface AuthStore {
  isAuthenticated: boolean;
  token: string | null;
}

const authStore: AuthStore = {
  isAuthenticated: false,
  token: null,
};

export const authModule = {
  /**
   * Initialize auth from localStorage
   */
  init(): void {
    const savedToken = localStorage.getItem('accessToken');
    if (savedToken) {
      authModule.setToken(savedToken);
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return authStore.isAuthenticated && authStore.token !== null;
  },

  /**
   * Get current token
   */
  getToken(): string | null {
    return authStore.token;
  },

  /**
   * Set token and update auth state
   */
  setToken(token: string): void {
    authStore.token = token;
    authStore.isAuthenticated = true;
    localStorage.setItem('accessToken', token);
    apiService.setAuthToken(token);
  },

  /**
   * Clear token and logout
   */
  clearToken(): void {
    authStore.token = null;
    authStore.isAuthenticated = false;
    localStorage.removeItem('accessToken');
    apiService.clearAuthToken();
  },
};
