/**
 * Auth state management - single source of truth for authentication
 */
import { reactive, readonly } from 'vue';
import { apiService } from '@services/ApiService';
import type { User } from '@models/User';

interface AuthStore {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
}

const authStore = reactive<AuthStore>({
  isAuthenticated: false,
  token: null,
  user: null,
});

// Export readonly state for components to watch reactively
export const authState = readonly(authStore);

export const authModule = {
  /** Initialize auth from localStorage */
  init(): void {
    const savedToken = localStorage.getItem('accessToken');
    if (savedToken) {
      authModule.setToken(savedToken);
    }
  },

  /** Check if user is authenticated */
  isAuthenticated(): boolean {
    return authStore.isAuthenticated && authStore.token !== null;
  },

  /** Get current token */
  getToken(): string | null {
    return authStore.token;
  },

  /** Get current user */
  getUser(): User | null {
    return authStore.user;
  },

  /** Set user */
  setUser(user: User): void {
    authStore.user = user;
  },

  /** Set token and update auth state */
  setToken(token: string): void {
    authStore.token = token;
    authStore.isAuthenticated = true;
    localStorage.setItem('accessToken', token);
    apiService.setAuthToken(token);
  },

  /** Clear token and logout */
  clearToken(): void {
    authStore.token = null;
    authStore.isAuthenticated = false;
    authStore.user = null;
    localStorage.removeItem('accessToken');
    apiService.clearAuthToken();
  },
};
