import { PortfolioController } from '@controllers/PortfolioController';
import { AuthController } from '@controllers/AuthController';
import { authModule } from '@/modules/auth';

type RoutePage = 'dashboard' | 'register' | 'login';
type NavigationTarget = RoutePage | 'home';

const NAV_LINK_FOR_PAGE: Record<NavigationTarget, string> = {
  home: 'nav-home',
  dashboard: 'nav-home',
  login: 'nav-login',
  register: 'nav-register',
};

/**
 * Simplified router that swaps controllers inside the shared view container.
 */
export class Router {
  private currentController: PortfolioController | AuthController | null = null;
  private readonly viewContainerId = 'view-container';

  /**
   * Navigate to a named route.
   */
  navigate(page: NavigationTarget): void {
    this.updateActiveLink(page);
    this.clearViewContainer();

    const normalized = page === 'home' ? 'login' : page;

    switch (normalized) {
      case 'dashboard': {
        if (!authModule.isAuthenticated()) {
          this.navigate('home');
          return;
        }

        this.currentController = new PortfolioController(this.viewContainerId);
        this.currentController.init();
        break;
      }
      case 'register': {
        this.currentController = new AuthController(this.viewContainerId, 'register');
        this.currentController.init();
        break;
      }
      case 'login':
      default: {
        this.currentController = new AuthController(this.viewContainerId, 'login');
        this.currentController.init();
        break;
      }
    }
  }

  /**
   * Attach navigation click handlers for the header links.
   */
  setupNavigation(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target) {
        return;
      }

      if (target.id === 'nav-home') {
        event.preventDefault();
        this.navigate('home');
      } else if (target.id === 'nav-register' || target.id === 'go-to-register' || target.id === 'cta-register') {
        event.preventDefault();
        this.navigate('register');
      } else if (target.id === 'nav-login' || target.id === 'go-to-login') {
        event.preventDefault();
        this.navigate('login');
      } else if (target.id === 'nav-portfolio' || target.id === 'nav-dashboard') {
        event.preventDefault();
        this.navigate('dashboard');
      }
    });
  }

  private clearViewContainer(): void {
    const container = document.getElementById(this.viewContainerId);
    if (container) {
      container.innerHTML = '';
    }
  }

  private updateActiveLink(page: NavigationTarget): void {
    document.querySelectorAll('.nav-link').forEach((link) => link.classList.remove('active'));
    const linkId = NAV_LINK_FOR_PAGE[page];
    const navLink = document.getElementById(linkId);
    if (navLink) {
      navLink.classList.add('active');
    }
  }
}

let globalRouter: Router | null = null;

export function getRouter(): Router {
  if (!globalRouter) {
    globalRouter = new Router();
    globalRouter.setupNavigation();
  }
  return globalRouter;
}
