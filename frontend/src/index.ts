/**
 * Main application entry point.
 */
import '@unocss/reset/tailwind.css';
import 'virtual:uno.css';
import '@/styles/main.css';
import '@/styles/AccountHub.css';
import 'vue-toastification/dist/index.css';

import { createApp } from 'vue';
import Toast from 'vue-toastification';
import App from '@/App.vue';
import router from '@/router/index';
import { authModule } from '@/modules/auth';
import { apiService } from '@/services/ApiService';
import { toastOptions } from '@/composables/useToast';

/**
 * Initialize the application.
 */
export async function initializeApp(): Promise<void> {
  // Initialize auth from localStorage
  authModule.init();

  // Redirect to login on any 401 (expired/invalid token)
  apiService.client.interceptors.response.use(
    response => response,
    (error: unknown) => {
      if (
        error != null &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 401
      ) {
        authModule.clearToken();
        void router.push({ name: 'login' });
      }
      return Promise.reject(error);
    },
  );

  // Create Vue app
  const app = createApp(App);
  app.use(router);
  app.use(Toast, toastOptions);

  // Mount app
  app.mount('#app');

  // If authenticated, fetch current user and navigate to dashboard
  if (authModule.isAuthenticated()) {
    try {
      const user = await apiService.getCurrentUser();
      authModule.setUser(user);
      void router.push({ name: 'dashboard' });
    } catch {
      // User fetch failed, clear auth
      authModule.clearToken();
      void router.push({ name: 'login' });
    }
  } else {
    void router.push({ name: 'login' });
  }
}

// Auto-initialize app on module load (skip in test environment)
if (!import.meta.env.VITEST) {
  initializeApp().catch(() => {
    // Initialization failed - app will show login page
  });
}
