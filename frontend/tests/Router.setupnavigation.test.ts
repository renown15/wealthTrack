/**
 * Router setupNavigation - Click event preventDefault tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '@/router';
import { authModule } from '@modules/auth';

// Mock controllers
vi.mock('@controllers/HomeController', () => ({
  HomeController: vi.fn().mockImplementation(() => ({
    init: vi.fn(),
  })),
}));

vi.mock('@controllers/PortfolioController', () => ({
  PortfolioController: vi.fn().mockImplementation(() => ({
    init: vi.fn(),
  })),
}));

vi.mock('@controllers/LoginController', () => ({
  LoginController: vi.fn().mockImplementation(() => ({
    init: vi.fn(),
  })),
}));

vi.mock('@controllers/RegistrationController', () => ({
  RegistrationController: vi.fn().mockImplementation(() => ({
    init: vi.fn(),
  })),
}));

vi.mock('@modules/auth', () => ({
  authModule: {
    isAuthenticated: vi.fn(() => false),
    setToken: vi.fn(),
    clearToken: vi.fn(),
    getToken: vi.fn(() => null),
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

    const navHome = document.createElement('a');
    navHome.id = 'nav-home';
    navHome.classList.add('nav-link');
    navHome.href = '#';
    document.body.appendChild(navHome);

    const navRegister = document.createElement('a');
    navRegister.id = 'nav-register';
    navRegister.classList.add('nav-link');
    navRegister.href = '#';
    document.body.appendChild(navRegister);

    const navLogin = document.createElement('a');
    navLogin.id = 'nav-login';
    navLogin.classList.add('nav-link');
    navLogin.href = '#';
    document.body.appendChild(navLogin);

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

    const goToRegister = document.createElement('button');
    goToRegister.id = 'go-to-register';
    document.body.appendChild(goToRegister);

    const goToLogin = document.createElement('button');
    goToLogin.id = 'go-to-login';
    document.body.appendChild(goToLogin);

    const ctaRegister = document.createElement('button');
    ctaRegister.id = 'cta-register';
    document.body.appendChild(ctaRegister);

    router = new Router();
    router.setupNavigation();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should handle nav-home click with preventDefault', () => {
    const navHome = document.getElementById('nav-home') as HTMLElement;
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

    navHome.dispatchEvent(clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should handle nav-register click with preventDefault', () => {
    const navRegister = document.getElementById('nav-register') as HTMLElement;
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

    navRegister.dispatchEvent(clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should handle nav-login click with preventDefault', () => {
    const navLogin = document.getElementById('nav-login') as HTMLElement;
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

    navLogin.dispatchEvent(clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
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

  it('should handle go-to-register button click', () => {
    const goToRegister = document.getElementById('go-to-register') as HTMLElement;
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

    goToRegister.dispatchEvent(clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should handle go-to-login button click', () => {
    const goToLogin = document.getElementById('go-to-login') as HTMLElement;
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

    goToLogin.dispatchEvent(clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should handle cta-register button click', () => {
    const ctaRegister = document.getElementById('cta-register') as HTMLElement;
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

    ctaRegister.dispatchEvent(clickEvent);

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

