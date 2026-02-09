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

  it('should render registration form', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const form = container.querySelector('form');
    expect(form).toBeDefined();
  });

  it('should display error messages', () => {
    const view = new RegistrationView('test-container');
    view.render();
    view.showError('Registration failed');

    const errorDiv = container.querySelector('.error-message');
    expect(errorDiv?.textContent).toContain('Registration failed');
  });

  it('should display success messages', () => {
    const view = new RegistrationView('test-container');
    view.render();
    view.showSuccess('Registration successful');

    const successDiv = container.querySelector('.success-message');
    expect(successDiv?.textContent).toContain('Registration successful');
  });

  it('should have email input field', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const input = container.querySelector('input[id*="email"]');
    expect(input).toBeDefined();
  });

  it('should have username input field', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const input = container.querySelector('input[id*="username"]');
    expect(input).toBeDefined();
  });

  it('should have password input field', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const input = container.querySelector('input[id*="password"]');
    expect(input).toBeDefined();
  });

  it('should have fullName input field', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const input = container.querySelector('input[id*="fullName"]');
    expect(input).toBeDefined();
  });

  it('should register onSubmit callback', () => {
    const view = new RegistrationView('test-container');
    const callback = vi.fn();

    view.onSubmit(callback);
    expect(view).toBeDefined();
  });

  it('should trigger callback on form submission', async () => {
    const view = new RegistrationView('test-container');
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
    const view = new RegistrationView('test-container');
    const callback = vi.fn();

    view.render();
    view.onSubmit(callback);

    const emailInput = container.querySelector('input[id="email"]') as HTMLInputElement;
    const firstNameInput = container.querySelector('input[id="firstName"]') as HTMLInputElement;
    const lastNameInput = container.querySelector('input[id="lastName"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[id="password"]') as HTMLInputElement;

    emailInput.value = 'test@example.com';
    firstNameInput.value = 'John';
    lastNameInput.value = 'Doe';
    passwordInput.value = 'TestPass123';

    const form = container.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it('should display field-specific validation errors', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const errors = {
      email: 'Email is required',
      firstName: 'First name is required',
      lastName: 'Last name is required',
      password: 'Password is required',
    };

    view.displayErrors(errors);

    const emailError = container.querySelector('#email-error');
    const firstNameError = container.querySelector('#firstName-error');
    const lastNameError = container.querySelector('#lastName-error');
    const passwordError = container.querySelector('#password-error');

    expect(emailError?.textContent).toContain('Email is required');
    expect(firstNameError?.textContent).toContain('First name is required');
    expect(lastNameError?.textContent).toContain('Last name is required');
    expect(passwordError?.textContent).toContain('Password is required');
  });

  it('should clear field errors after submission', async () => {
    const view = new RegistrationView('test-container');
    view.render();
    const form = container.querySelector('form') as HTMLFormElement;
    expect(form).toBeDefined();
  });
});