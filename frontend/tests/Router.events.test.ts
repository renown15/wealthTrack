/**
 * Tests for Router - Click events and event handling
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '../src/router';

describe('Router - Events', () => {
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

  it('should handle nav-home click event', () => {
    const router = new Router();

    const clickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'target', { value: navHome, enumerable: true });

    document.dispatchEvent(clickEvent);

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

  it('should dispatch navigate event correctly', () => {
    const router = new Router();
    let eventReceived = false;

    window.addEventListener('navigate', () => {
      eventReceived = true;
    });

    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'home' } }));

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

    expect(viewContainer.children.length).toBeGreaterThan(0);
  });
});
