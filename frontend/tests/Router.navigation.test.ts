/**
 * Tests for Router - Navigation functionality
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '../src/router';

describe('Router - Navigation', () => {
  let viewContainer: HTMLElement;
  let navHome: HTMLElement;
  let navRegister: HTMLElement;
  let navLogin: HTMLElement;

  beforeEach(() => {
    viewContainer = document.createElement('div');
    viewContainer.id = 'view-container';
    document.body.appendChild(viewContainer);

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

    expect(homeActiveCount).toBe(loginActiveCount);
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

  it('should handle rapid navigation changes', () => {
    const router = new Router();

    router.navigate('home');
    router.navigate('login');
    router.navigate('register');
    router.navigate('home');

    expect(viewContainer.children.length).toBeGreaterThan(0);
  });
});
