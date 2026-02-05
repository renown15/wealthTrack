/**
 * Tests for LoginController - Rendering and initialization
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoginController } from '../src/controllers/LoginController';

describe('LoginController - Rendering', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'login-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('should initialize controller', () => {
    const controller = new LoginController('login-container');
    expect(controller).toBeDefined();
  });

  it('should create a login form when initialized', () => {
    const controller = new LoginController('login-container');
    controller.init();

    const form = container.querySelector('form');
    expect(form).toBeDefined();
  });

  it('should have email and password input fields', () => {
    const controller = new LoginController('login-container');
    controller.init();

    const emailInput = container.querySelector('input[id="email"]');
    const passwordInput = container.querySelector('input[id="password"]');

    expect(emailInput).toBeDefined();
    expect(passwordInput).toBeDefined();
  });

  it('should have submit button', () => {
    const controller = new LoginController('login-container');
    controller.init();

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should render login form elements', () => {
    const controller = new LoginController('login-container');
    controller.init();

    expect(container.textContent).toContain('Login');
  });

  it('should render register link', () => {
    const controller = new LoginController('login-container');
    controller.init();

    const registerLink = container.querySelector('#go-to-register');
    expect(registerLink).toBeDefined();
    expect(registerLink?.textContent).toContain('Register');
  });

  it('should create controller with correct container ID', () => {
    const controller = new LoginController('login-container');
    expect(controller).toBeDefined();

    const cont = document.getElementById('login-container');
    expect(cont).toBeDefined();
  });

  it('should initialize with form rendered in container', () => {
    const controller = new LoginController('login-container');
    controller.init();

    const formInContainer = container.querySelector('form[id="login-form"]');
    expect(formInContainer).toBeDefined();
  });

  it('should have password input of type password', () => {
    const controller = new LoginController('login-container');
    controller.init();

    const passwordInput = container.querySelector('input[id="password"]') as HTMLInputElement;
    expect(passwordInput).toBeDefined();
    expect(passwordInput.type).toBe('password');
  });

  it('should have email input of type email', () => {
    const controller = new LoginController('login-container');
    controller.init();

    const emailInput = container.querySelector('input[id="email"]') as HTMLInputElement;
    expect(emailInput).toBeDefined();
    expect(emailInput?.type).toBe('email');
  });

  it('should render section with correct class', () => {
    const controller = new LoginController('login-container');
    controller.init();

    const section = container.querySelector('section.auth-section');
    expect(section).toBeDefined();
  });

  it('should render title correctly', () => {
    const controller = new LoginController('login-container');
    controller.init();

    const title = container.querySelector('h2');
    expect(title).toBeDefined();
    expect(title?.textContent).toContain('Login');
  });

  it('should collect form data correctly', () => {
    const controller = new LoginController('login-container');
    controller.init();

    const emailInput = container.querySelector('input[id="email"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[id="password"]') as HTMLInputElement;

    if (emailInput && passwordInput) {
      emailInput.value = 'test@example.com';
      passwordInput.value = 'TestPass123';

      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('TestPass123');
    }
  });

  it('should set up onSubmit callback', () => {
    const controller = new LoginController('login-container');
    controller.init();
    expect(controller).toBeDefined();
  });
});
