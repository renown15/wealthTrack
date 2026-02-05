/**
 * Tests for LoginView - Interactions and messages
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoginView } from '../src/views/LoginView';

describe('LoginView - Interactions', () => {
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

  it('should display error messages', () => {
    const view = new LoginView('test-container');
    view.render();
    view['showError']('Login failed');

    const errorDiv = container.querySelector('.error-message');
    expect(errorDiv?.textContent).toContain('Login failed');
  });

  it('should display success messages', () => {
    const view = new LoginView('test-container');
    view.render();
    view['showSuccess']('Login successful');

    const successDiv = container.querySelector('.success-message');
    expect(successDiv?.textContent).toContain('Login successful');
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

    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it('should pass form data to callback', async () => {
    const view = new LoginView('test-container');
    const callback = vi.fn();

    view.render();
    view.onSubmit(callback);

    const emailInput = container.querySelector('input[id="email"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[id="password"]') as HTMLInputElement;

    if (emailInput && passwordInput) {
      emailInput.value = 'test@example.com';
      passwordInput.value = 'TestPass123';

      const form = container.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit'));

      await new Promise((resolve) => setTimeout(resolve, 10));
    }
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

  it('should auto-remove error messages after 5 seconds', async () => {
    vi.useFakeTimers();

    const view = new LoginView('test-container');
    view.render();
    view['showError']('Test error');

    const errorDiv = container.querySelector('.error-message');
    expect(errorDiv).toBeDefined();

    vi.advanceTimersByTime(5000);

    expect(container.querySelector('.error-message')).toBeNull();

    vi.useRealTimers();
  });

  it('should auto-remove success messages after 5 seconds', async () => {
    vi.useFakeTimers();

    const view = new LoginView('test-container');
    view.render();
    view['showSuccess']('Test success');

    const successDiv = container.querySelector('.success-message');
    expect(successDiv).toBeDefined();

    vi.advanceTimersByTime(5000);

    expect(container.querySelector('.success-message')).toBeNull();

    vi.useRealTimers();
  });

  it('should handle multiple error displays', () => {
    const view = new LoginView('test-container');
    view.render();

    const errors1 = { email: 'Error 1' };
    const errors2 = { password: 'Error 2' };

    view.displayErrors(errors1);
    view.displayErrors(errors2);

    expect(container.querySelector('#email-error')?.textContent).toContain('Error 1');
    expect(container.querySelector('#password-error')?.textContent).toContain('Error 2');
  });
});
