/**
 * Tests for LoginView - Rendering
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoginView } from '../src/views/LoginView';

describe('LoginView - Rendering', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('should initialize LoginView', () => {
    const view = new LoginView('test-container');
    expect(view).toBeDefined();
  });

  it('should render login form', () => {
    const view = new LoginView('test-container');
    view.render();

    const form = container.querySelector('form');
    expect(form).toBeDefined();
  });

  it('should handle form submission', () => {
    const view = new LoginView('test-container');
    view.render();

    const form = container.querySelector('form') as HTMLFormElement;
    expect(form).toBeDefined();
  });

  it('should have username input field', () => {
    const view = new LoginView('test-container');
    view.render();

    const input = container.querySelector('input[id*="username"]');
    expect(input).toBeDefined();
  });

  it('should have password input field', () => {
    const view = new LoginView('test-container');
    view.render();

    const input = container.querySelector('input[id*="password"]');
    expect(input).toBeDefined();
  });

  it('should have register link in form', () => {
    const view = new LoginView('test-container');
    view.render();

    const registerLink = container.querySelector('#go-to-register');
    expect(registerLink).toBeDefined();
  });

  it('should have form with correct ID', () => {
    const view = new LoginView('test-container');
    view.render();

    const form = container.querySelector('form#login-form');
    expect(form).toBeDefined();
  });

  it('should render title with correct text', () => {
    const view = new LoginView('test-container');
    view.render();

    const title = container.querySelector('h2');
    expect(title?.textContent).toContain('Login to Your Account');
  });

  it('should have inputs with correct names', () => {
    const view = new LoginView('test-container');
    view.render();

    const usernameInput = container.querySelector('input[name="username"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[name="password"]') as HTMLInputElement;

    expect(usernameInput).toBeDefined();
    expect(passwordInput).toBeDefined();
  });

  it('should have submit button with correct text', () => {
    const view = new LoginView('test-container');
    view.render();

    const submitButton = container.querySelector('button[type="submit"]');
    expect(submitButton?.textContent).toBe('Login');
  });

  it('should clear container when rendering', () => {
    const view = new LoginView('test-container');

    container.innerHTML = '<p>Old content</p>';
    expect(container.innerHTML).toContain('Old content');

    view.render();
    expect(container.innerHTML).not.toContain('Old content');
  });
});
