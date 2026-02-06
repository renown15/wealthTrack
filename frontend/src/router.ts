/**
 * Router for handling navigation between pages.
 */
import { HomeController } from '@controllers/HomeController';
import { RegistrationController } from '@controllers/RegistrationController';
import { LoginController } from '@controllers/LoginController';

export class Router {
  private currentController:
    | HomeController
    | RegistrationController
    | LoginController
    | null = null;

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Navigate to a specific page.
   */
  async navigate(page: string): Promise<void> {
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
      case 'dashboard':
        this.currentController = new HomeController('view-container');
        await this.currentController.init();
        break;
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
        await this.currentController.init();
    }
  }

  /**
   * Setup navigation event listeners.
   */
  private setupEventListeners(): void {
    // Handle navigation links
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.id === 'nav-home' || target.id === 'cta-register') {
        e.preventDefault();
        void this.navigate('home');
      } else if (
        target.id === 'nav-register' ||
        target.id === 'go-to-register' ||
        target.id === 'cta-register'
      ) {
        e.preventDefault();
        void this.navigate('register');
      } else if (target.id === 'nav-login' || target.id === 'go-to-login') {
        e.preventDefault();
        void this.navigate('login');
      }
    });

    // Handle custom navigation events
    window.addEventListener('navigate', ((e: CustomEvent<{ page: string }>) => {
      void this.navigate(e.detail.page);
    }) as EventListener);
  }
}
