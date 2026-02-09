/**
 * Router for handling navigation between pages.
 * Simplified, synchronous navigation without event dispatching.
 */
import { HomeController } from '@controllers/HomeController';
import { PortfolioController } from '@controllers/PortfolioController';
import { RegistrationController } from '@controllers/RegistrationController';
import { LoginController } from '@controllers/LoginController';
import { authModule } from '@/modules/auth';

export class Router {
  private currentController:
    | HomeController
    | PortfolioController
    | RegistrationController
    | LoginController
    | null = null;

  /**
   * Navigate to a specific page synchronously
   */
  navigate(page: string): void {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.remove('active');
    });

    const navLink = document.getElementById(`nav-${page}`);
    if (navLink) {
      navLink.classList.add('active');
    }

    // Load appropriate controller
    switch (page) {
      case 'home':
      case 'dashboard': {
        // Check if user is authenticated
        if (authModule.isAuthenticated()) {
          // Show portfolio view for authenticated users
          this.currentController = new PortfolioController('view-container');
          this.currentController.init();
        } else {
          // Show home view for non-authenticated users
          this.currentController = new HomeController('view-container');
          this.currentController.init();
        }
        break;
      }
      case 'register':
        this.currentController = new RegistrationController('view-container');
        this.currentController.init();
        break;
      case 'login':
        this.currentController = new LoginController('view-container');
        this.currentController.init();
        break;
      default:
        this.currentController = new HomeController('view-container');
        this.currentController.init();
    }
  }

  /**
   * Setup navigation event listeners for links
   */
  setupNavigation(): void {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Handle navigation link clicks
      if (target.id === 'nav-home') {
        e.preventDefault();
        this.navigate('home');
      } else if (target.id === 'nav-register' || target.id === 'go-to-register' || target.id === 'cta-register') {
        e.preventDefault();
        this.navigate('register');
      } else if (target.id === 'nav-login' || target.id === 'go-to-login') {
        e.preventDefault();
        this.navigate('login');
      } else if (target.id === 'nav-portfolio' || target.id === 'nav-dashboard') {
        e.preventDefault();
        this.navigate('dashboard');
      }
    });
  }
}

// Global router instance
let globalRouter: Router | null = null;

export function getRouter(): Router {
  if (!globalRouter) {
    globalRouter = new Router();
    globalRouter.setupNavigation();
  }
  return globalRouter;
}
