/**
 * Router setupNavigation - Navigation behavior tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '@/router';
import { authModule } from '@modules/auth';

vi.mock('@controllers/PortfolioController', () => ({
  PortfolioController: vi.fn().mockImplementation(() => ({
    init: vi.fn(),
  })),
}));

vi.mock('@modules/auth', () => ({
  authModule: {
    isAuthenticated: vi.fn(() => false),
    setToken: vi.fn(),
    clearToken: vi.fn(),
    getToken: vi.fn(() => null),
    getUser: vi.fn(() => null),
    setUser: vi.fn(),
    init: vi.fn(),
  },
}));

describe('Router - setupNavigation navigation behavior', () => {
  let viewContainer: HTMLElement;
  let router: Router;

  beforeEach(() => {
    viewContainer = document.createElement('div');
    viewContainer.id = 'view-container';
    document.body.appendChild(viewContainer);

    const navDashboard = document.createElement('a');
    navDashboard.id = 'nav-dashboard';
    navDashboard.classList.add('nav-link');
    navDashboard.href = '#';
    document.body.appendChild(navDashboard);

    const navPortfolio = document.createElement('a');
    navPortfolio.id = 'nav-portfolio';
    navPortfolio.classList.add('nav-link');
    navPortfolio.href = '#';
    document.body.appendChild(navPortfolio);

    const userDisplay = document.createElement('span');
    userDisplay.id = 'user-display';
    document.body.appendChild(userDisplay);

    const navLogout = document.createElement('a');
    navLogout.id = 'nav-logout';
    userDisplay.appendChild(navLogout);

    router = new Router();
    router.setupNavigation();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should navigate to dashboard page on nav-dashboard click', () => {
    const navDashboard = document.getElementById('nav-dashboard') as HTMLElement;
    const navigateSpy = vi.spyOn(router, 'navigate');

    navDashboard.click();

    expect(navigateSpy).toHaveBeenCalledWith('dashboard');
  });

  it('should navigate to dashboard page on nav-portfolio click', () => {
    const navPortfolio = document.getElementById('nav-portfolio') as HTMLElement;
    const navigateSpy = vi.spyOn(router, 'navigate');

    navPortfolio.click();

    expect(navigateSpy).toHaveBeenCalledWith('dashboard');
  });

  it('should navigate to login page on nav-logout click', () => {
    const navLogout = document.getElementById('nav-logout') as HTMLElement;
    const navigateSpy = vi.spyOn(router, 'navigate');

    navLogout.click();

    expect(navigateSpy).toHaveBeenCalledWith('login');
  });

  it('should clear authentication token when nav-logout is clicked', () => {
    const navLogout = document.getElementById('nav-logout') as HTMLElement;

    navLogout.click();

    expect(authModule.clearToken).toHaveBeenCalled();
  });
});
