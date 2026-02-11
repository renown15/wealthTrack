/**
 * Main application entry point.
 */
import '@unocss/reset/tailwind.css';
import 'virtual:uno.css';
import '@/styles/main.css';
import '@/styles/AccountHub.css';
import { getRouter } from '@/router';
import { authModule } from '@/modules/auth';

/**
 * Initialize the application.
 */
export function initializeApp(): void {
  // Initialize auth from localStorage
  authModule.init();

  // Get router instance (initializes navigation)
  const router = getRouter();

  router.navigate(authModule.isAuthenticated() ? 'dashboard' : 'home');
}

// Auto-initialize app on module load
initializeApp();
