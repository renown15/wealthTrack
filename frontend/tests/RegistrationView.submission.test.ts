/**
 * Tests for RegistrationView.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RegistrationView } from '../src/views/RegistrationView';

describe('RegistrationView', () => {
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

  it('should initialize RegistrationView', () => {
    const view = new RegistrationView('test-container');
    expect(view).toBeDefined();
  });


  it('should have login link in form', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const loginLink = container.querySelector('#go-to-login');
    expect(loginLink).toBeDefined();
  });

  it('should have form with correct ID', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const form = container.querySelector('form#registration-form');
    expect(form).toBeDefined();
  });

  it('should render title with correct text', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const title = container.querySelector('h2');
    expect(title?.textContent).toContain('Create Your Account');
  });

  it('should have inputs with correct names', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
    const usernameInput = container.querySelector('input[name="username"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[name="password"]') as HTMLInputElement;
    const fullNameInput = container.querySelector('input[name="fullName"]') as HTMLInputElement;

    expect(emailInput).toBeDefined();
    expect(usernameInput).toBeDefined();
    expect(passwordInput).toBeDefined();
    expect(fullNameInput).toBeDefined();
  });

  it('should have submit button with correct text', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const submitButton = container.querySelector('button[type="submit"]');
    expect(submitButton?.textContent).toBe('Register');
  });

  it('should clear container when rendering', () => {
    const view = new RegistrationView('test-container');

    // Add some content
    container.innerHTML = '<p>Old content</p>';
    expect(container.innerHTML).toContain('Old content');

    // Render should clear it
    view.render();
    expect(container.innerHTML).not.toContain('Old content');
  });

  it('should auto-remove error messages after 5 seconds', async () => {
    vi.useFakeTimers();

    const view = new RegistrationView('test-container');
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

    const view = new RegistrationView('test-container');
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
    const view = new RegistrationView('test-container');
    view.render();

    const errors1 = { email: 'Error 1' };
    const errors2 = { password: 'Error 2' };

    view.displayErrors(errors1);
    view.displayErrors(errors2);

    expect(container.querySelector('#email-error')?.textContent).toContain('Error 1');
    expect(container.querySelector('#password-error')?.textContent).toContain('Error 2');
  });

  it('should handle form submission with all fields', async () => {
    const view = new RegistrationView('test-container');
    const callback = vi.fn();

    view.render();
    view.onSubmit(callback);

    const form = container.querySelector('form') as HTMLFormElement;

    // Fill in all fields
    const emailInput = container.querySelector('input[id="email"]') as HTMLInputElement;
    const firstNameInput = container.querySelector('input[id="firstName"]') as HTMLInputElement;
    const lastNameInput = container.querySelector('input[id="lastName"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[id="password"]') as HTMLInputElement;

    emailInput.value = 'user@example.com';
    firstNameInput.value = 'John';
    lastNameInput.value = 'Doe';
    passwordInput.value = 'SecurePass1';

    // Submit the form
    form.dispatchEvent(new Event('submit'));

    await new Promise((resolve) => setTimeout(resolve, 10));
  });
});
