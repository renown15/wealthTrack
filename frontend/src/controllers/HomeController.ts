/**
 * Home controller.
 */
import { HomeView } from '../views/HomeView';
import { apiService } from '../services/ApiService';
import type { User } from '../models/User';

export class HomeController {
  private view: HomeView;
  private currentUser: User | null = null;

  constructor(containerId: string) {
    this.view = new HomeView(containerId);
  }

  /**
   * Initialize the home controller.
   */
  async init(): Promise<void> {
    // Try to load current user if authenticated
    const token = apiService.getAuthToken();
    if (token) {
      try {
        this.currentUser = await apiService.getCurrentUser();
      } catch (error) {
        // Token is invalid or user not found - clear it
        localStorage.removeItem('accessToken');
        apiService.clearAuthToken();
      }
    }

    // Render home view with user data if available
    this.view.render(this.currentUser);

    // Set up logout handler if user is authenticated
    if (this.currentUser) {
      this.view.onLogout(() => this.handleLogout());
    }
  }

  /**
   * Handle user logout.
   */
  private handleLogout(): void {
    // Clear token and user data
    localStorage.removeItem('accessToken');
    apiService.clearAuthToken();
    this.currentUser = null;

    // Show logout message and redirect
    this.view.showSuccess('Logged out successfully. Redirecting to home...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}
