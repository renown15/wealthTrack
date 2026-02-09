/**
 * Portfolio controller - manages portfolio view and navigation.
 */
import { createApp } from 'vue';
import { apiService } from '@services/ApiService';
import { getRouter } from '@/router';

export class PortfolioController {
  private containerId: string;

  constructor(containerId: string) {
    this.containerId = containerId;
  }

  /**
   * Initialize the portfolio controller synchronously.
   */
  init(): void {
    // Verify token exists
    const token = apiService.getAuthToken();
    if (!token) {
      getRouter().navigate('login');
      return;
    }

    // Mount Vue app to container with PortfolioView
    const container = document.getElementById(this.containerId);
    if (!container) {
      return;
    }

    // Clear container
    container.innerHTML = '';

    // Dynamically import AccountHub
    import('../views/AccountHub/AccountHub.vue').then(({ default: AccountHub }: { default: unknown }) => {
      const app = createApp(AccountHub as never);
      app.mount(container);
    }).catch((_error) => {
      // Still try to validate token in background
      apiService.getCurrentUser().catch(() => {
        getRouter().navigate('login');
      });
    });

    // Validate token in background (async)
    apiService.getCurrentUser().catch((_error) => {
      // Clear token and redirect to login
      apiService.clearAuthToken();
      getRouter().navigate('login');
    });
  }
}

