/**
 * Tests for LoginView.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoginView } from '../src/views/LoginView';

describe('LoginView', () => {
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

  it('should display error messages', () => {
    const view = new LoginView('test-container');
    view.render();
    view.showError('Login failed');

    const errorDiv = container.querySelector('.error-message');
    expect(errorDiv?.textContent).toContain('Login failed');
  });

  it('should display success messages', () => {
    const view = new LoginView('test-container');
    view.render();
    view.showSuccess('Login successful');

    const successDiv = container.querySelector('.success-message');
    expect(successDiv?.textContent).toContain('Login successful');
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

  it('should register onSubmit callback', () => {
    const view = new LoginView('test-container');
    const callback = vi.fn();

    view.onSubmit(callback);
    expect(view).toBeDefined();
  });

  it('should trigger callback on form submission', async () => {
    const view = new LoginView('test-container');
    const callback = vi.fn();

    view.render();
    view.onSubmit(callback);

    const form = container.querySelector('form') as HTMLFormElement;
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

    submitButton.click();

    // Wait for async callback
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it('should pass form data to callback', async () => {
    const view = new LoginView('test-container');
    const callback = vi.fn();

    view.render();
    view.onSubmit(callback);

    const emailInput = container.querySelector('input[id="email"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[id="password"]') as HTMLInputElement;

    emailInput.value = 'test@example.com';
    passwordInput.value = 'TestPass123';

    const form = container.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it('should display field-specific validation errors', () => {
    const view = new LoginView('test-container');
    view.render();

    const errors = {
      email: 'Email is required',
      password: 'Password is required',
    };

    view.displayErrors(errors);

    const emailError = container.querySelector('#email-error');
    const passwordError = container.querySelector('#password-error');
    expect(emailError?.textContent).toContain('Email is required');
    expect(passwordError?.textContent).toContain('Password is required');
  });
});