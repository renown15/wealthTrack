/**
 * Main application entry point.
 */
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

  // Navigate to home page
  router.navigate('home');
}

// Auto-initialize app on module load
initializeApp();
