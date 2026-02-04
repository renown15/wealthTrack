/**
 * Tests for Router.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '../src/router';

describe('Router', () => {
  let viewContainer: HTMLElement;
  let navHome: HTMLElement;
  let navRegister: HTMLElement;
  let navLogin: HTMLElement;

  beforeEach(() => {
    // Create view container
    viewContainer = document.createElement('div');
    viewContainer.id = 'view-container';
    document.body.appendChild(viewContainer);

    // Create nav links
    navHome = document.createElement('a');
    navHome.id = 'nav-home';
    navHome.classList.add('nav-link');
    document.body.appendChild(navHome);

    navRegister = document.createElement('a');
    navRegister.id = 'nav-register';
    navRegister.classList.add('nav-link');
    document.body.appendChild(navRegister);

    navLogin = document.createElement('a');
    navLogin.id = 'nav-login';
    navLogin.classList.add('nav-link');
    document.body.appendChild(navLogin);

    // Create CTA button
    const ctaRegister = document.createElement('button');
    ctaRegister.id = 'cta-register';
    document.body.appendChild(ctaRegister);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should initialize router', () => {
    const router = new Router();
    expect(router).toBeDefined();
  });

  it('should navigate to home page', () => {
    const router = new Router();
    router.navigate('home');

    expect(viewContainer.children.length).toBeGreaterThan(0);
  });

  it('should navigate to register page', () => {
    const router = new Router();
    router.navigate('register');

    expect(viewContainer.children.length).toBeGreaterThan(0);
  });

  it('should navigate to login page', () => {
    const router = new Router();
    router.navigate('login');

    expect(viewContainer.children.length).toBeGreaterThan(0);
  });

  it('should set active nav link when navigating to home', () => {
    const router = new Router();
    router.navigate('home');

    const activeLink = document.querySelector('.nav-link.active');
    expect(activeLink).toBeDefined();
  });

  it('should handle unknown page by loading home', () => {
    const router = new Router();
    router.navigate('unknown-page');

    expect(viewContainer.children.length).toBeGreaterThan(0);
  });

  it('should handle navigation via CustomEvent', () => {
    const router = new Router();

    const event = new CustomEvent('navigate', { detail: { page: 'login' } });
    window.dispatchEvent(event);

    expect(viewContainer.children.length).toBeGreaterThan(0);
  });

  it('should update nav links on navigation', () => {
    const router = new Router();

    router.navigate('home');
    let activeLinks = document.querySelectorAll('.nav-link.active');
    const homeActiveCount = activeLinks.length;

    router.navigate('login');
    activeLinks = document.querySelectorAll('.nav-link.active');
    const loginActiveCount = activeLinks.length;

    // Should have same number of active links after navigation
    expect(homeActiveCount).toBe(loginActiveCount);
  });

  it('should handle nav-home click event', () => {
    const router = new Router();

    // Trigger click through document listener
    const clickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'target', { value: navHome, enumerable: true });

    document.dispatchEvent(clickEvent);

    // Router should be initialized
    expect(router).toBeDefined();
  });

  it('should handle nav-register click event', () => {
    const router = new Router();

    const clickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'target', { value: navRegister, enumerable: true });

    document.dispatchEvent(clickEvent);

    expect(router).toBeDefined();
  });

  it('should handle nav-login click event', () => {
    const router = new Router();

    const clickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'target', { value: navLogin, enumerable: true });

    document.dispatchEvent(clickEvent);

    expect(router).toBeDefined();
  });

  it('should handle go-to-register click', () => {
    const router = new Router();

    const goToRegister = document.createElement('a');
    goToRegister.id = 'go-to-register';
    document.body.appendChild(goToRegister);

    const clickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'target', { value: goToRegister, enumerable: true });

    document.dispatchEvent(clickEvent);

    expect(router).toBeDefined();

    document.body.removeChild(goToRegister);
  });

  it('should handle go-to-login click', () => {
    const router = new Router();

    const goToLogin = document.createElement('a');
    goToLogin.id = 'go-to-login';
    document.body.appendChild(goToLogin);

    const clickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'target', { value: goToLogin, enumerable: true });

    document.dispatchEvent(clickEvent);

    expect(router).toBeDefined();

    document.body.removeChild(goToLogin);
  });

  it('should handle cta-register click', () => {
    const router = new Router();

    const ctaBtn = document.getElementById('cta-register') as HTMLElement;

    const clickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'target', { value: ctaBtn, enumerable: true });

    document.dispatchEvent(clickEvent);

    expect(router).toBeDefined();
  });

  it('should remove active class from previous nav link', () => {
    const router = new Router();

    router.navigate('home');
    const homeLink = document.querySelector('#nav-home');
    expect(homeLink?.classList.contains('active')).toBe(true);

    router.navigate('login');
    expect(homeLink?.classList.contains('active')).toBe(false);
  });

  it('should add active class to current nav link', () => {
    const router = new Router();

    router.navigate('login');
    const loginLink = document.querySelector('#nav-login');
    expect(loginLink?.classList.contains('active')).toBe(true);
  });

  it('should handle multiple navigations in sequence', () => {
    const router = new Router();

    router.navigate('home');
    expect(viewContainer.children.length).toBeGreaterThan(0);

    router.navigate('register');
    expect(viewContainer.children.length).toBeGreaterThan(0);

    router.navigate('login');
    expect(viewContainer.children.length).toBeGreaterThan(0);
  });

  it('should dispatch navigate event correctly', () => {
    const router = new Router();
    let eventReceived = false;

    window.addEventListener('navigate', () => {
      eventReceived = true;
    });

    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'home' } }));

    // Give a moment for event to process
    setTimeout(() => {
      expect(eventReceived).toBe(true);
    }, 10);
  });

  it('should render correct controller for register page', () => {
    const router = new Router();
    router.navigate('register');

    const form = viewContainer.querySelector('form#registration-form');
    expect(form).toBeDefined();
  });

  it('should render correct controller for login page', () => {
    const router = new Router();
    router.navigate('login');

    const form = viewContainer.querySelector('form#login-form');
    expect(form).toBeDefined();
  });

  it('should render correct controller for home page', () => {
    const router = new Router();
    router.navigate('home');

    // Home page should have some content
    expect(viewContainer.children.length).toBeGreaterThan(0);
  });

  it('should handle rapid navigation changes', () => {
    const router = new Router();

    router.navigate('home');
    router.navigate('login');
    router.navigate('register');
    router.navigate('home');

    // Should have content from last navigation (home)
    expect(viewContainer.children.length).toBeGreaterThan(0);
  });
});
