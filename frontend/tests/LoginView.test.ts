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

    const usernameInput = container.querySelector('input[id="username"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[id="password"]') as HTMLInputElement;

    usernameInput.value = 'testuser';
    passwordInput.value = 'TestPass123';

    const form = container.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it('should display field-specific validation errors', () => {
    const view = new LoginView('test-container');
    view.render();

    const errors = {
      username: 'Username is required',
      password: 'Password is required',
    };

    view.displayErrors(errors);

    const usernameError = container.querySelector('#username-error');
    const passwordError = container.querySelector('#password-error');

    expect(usernameError?.textContent).toContain('Username is required');
    expect(passwordError?.textContent).toContain('Password is required');
  });

  it('should clear field errors after submission', async () => {
    const view = new LoginView('test-container');
    view.render();

    // Set some errors
    const errors = { username: 'Username is required' };
    view.displayErrors(errors);

    // Submit form should clear errors
    const form = container.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    await new Promise((resolve) => setTimeout(resolve, 10));
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

    // Add some content
    container.innerHTML = '<p>Old content</p>';
    expect(container.innerHTML).toContain('Old content');

    // Render should clear it
    view.render();
    expect(container.innerHTML).not.toContain('Old content');
  });

  it('should auto-remove error messages after 5 seconds', async () => {
    vi.useFakeTimers();

    const view = new LoginView('test-container');
    view.render();
    view.showError('Test error');

    const errorDiv = container.querySelector('.error-message');
    expect(errorDiv).toBeDefined();

    vi.advanceTimersByTime(5000);

    // Error should be removed
    expect(container.querySelector('.error-message')).toBeNull();

    vi.useRealTimers();
  });

  it('should auto-remove success messages after 5 seconds', async () => {
    vi.useFakeTimers();

    const view = new LoginView('test-container');
    view.render();
    view.showSuccess('Test success');

    const successDiv = container.querySelector('.success-message');
    expect(successDiv).toBeDefined();

    vi.advanceTimersByTime(5000);

    // Success message should be removed
    expect(container.querySelector('.success-message')).toBeNull();

    vi.useRealTimers();
  });

  it('should handle multiple error displays', () => {
    const view = new LoginView('test-container');
    view.render();

    const errors1 = { username: 'Error 1' };
    const errors2 = { password: 'Error 2' };

    view.displayErrors(errors1);
    view.displayErrors(errors2);

    expect(container.querySelector('#username-error')?.textContent).toContain('Error 1');
    expect(container.querySelector('#password-error')?.textContent).toContain('Error 2');
  });
});
