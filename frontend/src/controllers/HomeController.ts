/**
 * Home controller.
 */
import { HomeView } from '@views/HomeView';
import { apiService } from '@services/ApiService';
import { authModule } from '@/modules/auth';
import { getRouter } from '@/router';
import type { User } from '@models/User';

export class HomeController {
  private view: HomeView;
  private currentUser: User | null = null;

  constructor(containerId: string) {
    this.view = new HomeView(containerId);
  }

  /**
   * Initialize the home controller.
   */
  init(): void {
    // Try to load current user if authenticated
    if (authModule.isAuthenticated()) {
      apiService.getCurrentUser().then((user) => {
        this.currentUser = user;
        this.renderView();
      }).catch(() => {
        // Token is invalid - clear it and show home without user
        authModule.clearToken();
        this.renderView();
      });
    } else {
      this.renderView();
    }
  }

  /**
   * Render the view with current user
   */
  private renderView(): void {
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
    authModule.clearToken();
    this.currentUser = null;

    // Show logout message and redirect
    this.view.showSuccess('Logged out successfully. Redirecting to home...');
    setTimeout(() => {
      getRouter().navigate('home');    }, 1000);
  }
}