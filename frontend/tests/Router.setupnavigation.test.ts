/**
 * Router setupNavigation - Click event preventDefault tests
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

describe('Router - setupNavigation click preventDefault', () => {
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
    navLogout.href = '#';
    userDisplay.appendChild(navLogout);

    router = new Router();
    router.setupNavigation();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should handle nav-logout click with preventDefault', () => {
    const navLogout = document.getElementById('nav-logout') as HTMLElement;
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

    navLogout.dispatchEvent(clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should clear token when nav-logout is clicked', () => {
    const navLogout = document.getElementById('nav-logout') as HTMLElement;
    
    navLogout.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(authModule.clearToken).toHaveBeenCalled();
  });

  it('should handle nav-portfolio click with preventDefault', () => {
    const navPortfolio = document.getElementById('nav-portfolio') as HTMLElement;
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

    navPortfolio.dispatchEvent(clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should handle nav-dashboard click with preventDefault', () => {
    const navDashboard = document.getElementById('nav-dashboard') as HTMLElement;
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

    navDashboard.dispatchEvent(clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should not preventDefault for unrelated elements', () => {
    const unrelatedButton = document.createElement('button');
    unrelatedButton.id = 'unrelated-button';
    document.body.appendChild(unrelatedButton);

    const clickEvent = new MouseEvent('click', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

    unrelatedButton.dispatchEvent(clickEvent);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });
});

