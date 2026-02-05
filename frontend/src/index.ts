/**
 * Main application entry point.
 */
import { Router } from '@/router';

/**
 * Initialize the application.
 */
export async function initializeApp(): Promise<void> {
  // Initialize router
  const router = new Router();

  // Navigate to home page on load (async)
  await router.navigate('home');
}

// Auto-initialize app on module load
void initializeApp();
