/**
 * Router setupNavigation - Navigation behavior and active link tests
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

describe('Router - setupNavigation navigation behavior', () => {
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

    router = new Router();
    router.setupNavigation();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should navigate to correct page on nav-home click', () => {
    const navHome = document.getElementById('nav-home') as HTMLElement;
    const navigateSpy = vi.spyOn(router, 'navigate');

    navHome.click();

    expect(navigateSpy).toHaveBeenCalledWith('home');
  });

  it('should navigate to correct page on nav-register click', () => {
    const navRegister = document.getElementById('nav-register') as HTMLElement;
    const navigateSpy = vi.spyOn(router, 'navigate');

    navRegister.click();

    expect(navigateSpy).toHaveBeenCalledWith('register');
  });

  it('should navigate to correct page on nav-login click', () => {
    const navLogin = document.getElementById('nav-login') as HTMLElement;
    const navigateSpy = vi.spyOn(router, 'navigate');

    navLogin.click();

    expect(navigateSpy).toHaveBeenCalledWith('login');
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

  it('should set active class on nav-login when navigating to login', () => {
    const navLogin = document.getElementById('nav-login') as HTMLElement;
    navLogin.click();

    expect(navLogin.classList.contains('active')).toBe(true);
  });

  it('should set active class on nav-register when navigating to register', () => {
    const navRegister = document.getElementById('nav-register') as HTMLElement;
    navRegister.click();

    expect(navRegister.classList.contains('active')).toBe(true);
  });

  it('should set active class on nav-home when navigating to home', () => {
    const navHome = document.getElementById('nav-home') as HTMLElement;
    navHome.click();

    expect(navHome.classList.contains('active')).toBe(true);
  });

  it('should remove active class from previous nav links', () => {
    const navHome = document.getElementById('nav-home') as HTMLElement;
    const navLogin = document.getElementById('nav-login') as HTMLElement;

    navHome.click();
    expect(navHome.classList.contains('active')).toBe(true);

    navLogin.click();
    expect(navHome.classList.contains('active')).toBe(false);
    expect(navLogin.classList.contains('active')).toBe(true);
  });
});
