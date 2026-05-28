/**
 * Auth state management - single source of truth for authentication
 */
import { reactive, readonly } from 'vue';
import { apiService } from '@services/ApiService';
import type { User } from '@models/User';

function getTokenExpiry(token: string): number | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const decoded = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

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

let _expiryTimer: ReturnType<typeof setTimeout> | null = null;
let _expiryCallback: (() => void) | null = null;

// Export readonly state for components to watch reactively
export const authState = readonly(authStore);

export const authModule = {
  /** Register a callback to be called when the session timer expires */
  onExpiry(cb: () => void): void {
    _expiryCallback = cb;
  },

  /** Initialize auth from localStorage, ignoring already-expired tokens */
  init(): void {
    const savedToken = localStorage.getItem('accessToken');
    if (!savedToken) return;
    const expMs = getTokenExpiry(savedToken);
    if (expMs !== null && expMs <= Date.now()) {
      localStorage.removeItem('accessToken');
      return;
    }
    authModule.setToken(savedToken);
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

  /** Set token, update auth state, and schedule expiry redirect */
  setToken(token: string): void {
    if (_expiryTimer) { clearTimeout(_expiryTimer); _expiryTimer = null; }
    authStore.token = token;
    authStore.isAuthenticated = true;
    localStorage.setItem('accessToken', token);
    apiService.setAuthToken(token);
    const expMs = getTokenExpiry(token);
    if (expMs !== null) {
      const delay = expMs - Date.now();
      if (delay > 0) {
        _expiryTimer = setTimeout(() => { authModule.clearToken(); _expiryCallback?.(); }, delay);
      }
    }
  },

  /** Clear token and cancel any pending expiry timer */
  clearToken(): void {
    if (_expiryTimer) { clearTimeout(_expiryTimer); _expiryTimer = null; }
    authStore.token = null;
    authStore.isAuthenticated = false;
    authStore.user = null;
    localStorage.removeItem('accessToken');
    apiService.clearAuthToken();
  },
};
