/**
 * Main application entry point.
 */
import { Router } from '@/router';
import { apiService } from '@services/ApiService';
import { debug } from '@utils/debug';

/**
 * Initialize the application.
 */
export async function initializeApp(): Promise<void> {
  // Restore auth token from localStorage if it exists
  const savedToken = localStorage.getItem('accessToken');
  if (savedToken) {
    debug.log('[Auth] Restoring token from localStorage:', savedToken.substring(0, 20) + '...');
    apiService.setAuthToken(savedToken);
    debug.log('[Auth] Token set in ApiService');
  } else {
    debug.log('[Auth] No saved token found');
  }

  // Initialize router
  const router = new Router();

  // Navigate to home page on load (async)
  await router.navigate('home');
}

// Auto-initialize app on module load
void initializeApp();
