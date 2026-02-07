/**
 * Portfolio controller - manages portfolio view and navigation.
 */
import { createApp } from 'vue';
import { apiService } from '@services/ApiService';

export class PortfolioController {
  private containerId: string;

  constructor(containerId: string) {
    this.containerId = containerId;
  }

  /**
   * Initialize the portfolio controller.
   */
  async init(): Promise<void> {
    // Try to load current user if authenticated
    const token = apiService.getAuthToken();
    if (!token) {
      // Redirect to login if not authenticated
      window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'login' } }));
      return;
    }

    try {
      await apiService.getCurrentUser();
    } catch (error) {
      // Token is invalid or user not found - clear it and redirect to login
      localStorage.removeItem('accessToken');
      apiService.clearAuthToken();
      window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'login' } }));
      return;
    }

    // Mount Vue app to container with PortfolioView
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container with id ${this.containerId} not found`);
      return;
    }

    // Clear container
    container.innerHTML = '';

    // Dynamically import PortfolioView to avoid TS module resolution issues
    // @ts-ignore - Vue modules are resolved by Vite at bundling time
    const { default: PortfolioView } = await import('../views/PortfolioView.vue');

    // Create and mount Vue app
    const app = createApp(PortfolioView);
    app.mount(container);
  }
}

