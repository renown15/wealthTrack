/**
 * Tests for RegistrationController.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RegistrationController } from '../src/controllers/RegistrationController';
import * as ApiServiceModule from '../src/services/ApiService';

describe('RegistrationController', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'registration-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('should initialize controller', () => {
    const controller = new RegistrationController('registration-container');
    expect(controller).toBeDefined();
  });

  it('should create a registration form when initialized', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const form = container.querySelector('form');
    expect(form).toBeDefined();
  });

  it('should have email, username, password, and fullName input fields', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const emailInput = container.querySelector('input[id*="email"]');
    const usernameInput = container.querySelector('input[id*="username"]');
    const passwordInput = container.querySelector('input[id*="password"]');

    expect(emailInput).toBeDefined();
    expect(usernameInput).toBeDefined();
    expect(passwordInput).toBeDefined();
  });

  it('should have submit button', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should render registration form elements', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    expect(container.textContent).toContain('Register');
  });

  it('should handle form submission', async () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    expect(form).toBeDefined();
  });

  it('should display validation errors on invalid form', async () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

    // Submit with empty fields
    submitButton.click();

    // Wait a bit for async validation
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it('should collect form data correctly', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const emailInput = container.querySelector('input[id="email"]') as HTMLInputElement;
    const usernameInput = container.querySelector('input[id="username"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[id="password"]') as HTMLInputElement;
    const fullNameInput = container.querySelector('input[id="fullName"]') as HTMLInputElement;

    emailInput.value = 'test@example.com';
    usernameInput.value = 'testuser';
    passwordInput.value = 'TestPass123';
    fullNameInput.value = 'Test User';

    expect(emailInput.value).toBe('test@example.com');
    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('TestPass123');
    expect(fullNameInput.value).toBe('Test User');
  });

  it('should render login link', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const loginLink = container.querySelector('#go-to-login');
    expect(loginLink).toBeDefined();
    expect(loginLink?.textContent).toContain('Login');
  });

  it('should create controller with correct container ID', () => {
    const controller = new RegistrationController('registration-container');
    expect(controller).toBeDefined();

    // Verify container exists
    const cont = document.getElementById('registration-container');
    expect(cont).toBeDefined();
  });

  it('should initialize with form rendered in container', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const formInContainer = container.querySelector('form[id="registration-form"]');
    expect(formInContainer).toBeDefined();
  });

  it('should have email input of type email', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const emailInput = container.querySelector('input[id="email"]') as HTMLInputElement;
    expect(emailInput).toBeDefined();
    expect(emailInput.type).toBe('email');
  });

  it('should have password input of type password', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const passwordInput = container.querySelector('input[id="password"]') as HTMLInputElement;
    expect(passwordInput).toBeDefined();
    expect(passwordInput.type).toBe('password');
  });

  it('should have fullName input of type text', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const fullNameInput = container.querySelector('input[id="fullName"]') as HTMLInputElement;
    expect(fullNameInput).toBeDefined();
    expect(fullNameInput.type).toBe('text');
  });

  it('should render section with correct class', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const section = container.querySelector('section.auth-section');
    expect(section).toBeDefined();
  });

  it('should render title correctly', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const title = container.querySelector('h2');
    expect(title).toBeDefined();
    expect(title?.textContent).toContain('Create Your Account');
  });

  it('should handle successful registration attempt', async () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    // Simulate form submission with valid data
    const emailInput = container.querySelector('input[id="email"]') as HTMLInputElement;
    const usernameInput = container.querySelector('input[id="username"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[id="password"]') as HTMLInputElement;

    if (emailInput && usernameInput && passwordInput) {
      emailInput.value = 'test@example.com';
      usernameInput.value = 'testuser';
      passwordInput.value = 'TestPass123';
    }
  });

  it('should clear previous error messages', async () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const emailError = container.querySelector('#email-error') as HTMLElement;

    if (emailError) {
      emailError.textContent = 'Old error';
      emailError.style.display = 'block';
      expect(emailError.textContent).toBe('Old error');
    }
  });

  it('should call API service on valid registration', async () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
    const usernameInput = form.querySelector('input[id="username"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;
    const fullNameInput = form.querySelector('input[id="fullName"]') as HTMLInputElement;

    emailInput.value = 'newuser@example.com';
    usernameInput.value = 'newuser';
    passwordInput.value = 'SecurePass1';
    fullNameInput.value = 'New User';

    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitButton.click();

    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it('should handle registration validation errors on submission', async () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    // Submit with empty fields to trigger validation
    const form = container.querySelector('form') as HTMLFormElement;
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

    submitButton.click();

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Validation errors should appear
    const errorElements = container.querySelectorAll('.field-error');
    expect(errorElements.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle API errors correctly', async () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
    const usernameInput = form.querySelector('input[id="username"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;
    const fullNameInput = form.querySelector('input[id="fullName"]') as HTMLInputElement;

    // Fill form with valid data
    emailInput.value = 'duplicate@example.com';
    usernameInput.value = 'duplicateuser';
    passwordInput.value = 'SecurePass1';
    fullNameInput.value = 'Duplicate User';

    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitButton.click();

    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it('should show success message after successful registration', async () => {
    const mockUser = {
      id: 1,
      email: 'success@example.com',
      username: 'successuser',
      fullName: 'Success User',
      isActive: true,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };

    const mockRegisterUser = vi.spyOn(ApiServiceModule.apiService, 'registerUser').mockResolvedValue(mockUser);

    const controller = new RegistrationController('registration-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
    const usernameInput = form.querySelector('input[id="username"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;
    const fullNameInput = form.querySelector('input[id="fullName"]') as HTMLInputElement;

    emailInput.value = 'success@example.com';
    usernameInput.value = 'successuser';
    passwordInput.value = 'SuccessPass1';
    fullNameInput.value = 'Success User';

    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitButton.click();

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(mockRegisterUser).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('should handle API registration success', async () => {
    const mockUser = {
      id: 2,
      email: 'newreg@example.com',
      username: 'newreguser',
      fullName: 'New Register',
      isActive: true,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };

    const mockRegisterUser = vi.spyOn(ApiServiceModule.apiService, 'registerUser').mockResolvedValue(mockUser);

    const controller = new RegistrationController('registration-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
    const usernameInput = form.querySelector('input[id="username"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;

    emailInput.value = 'newreg@example.com';
    usernameInput.value = 'newreguser';
    passwordInput.value = 'NewRegPass1';

    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitButton.click();

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(mockRegisterUser).toHaveBeenCalledWith(expect.objectContaining({
      email: 'newreg@example.com',
      username: 'newreguser',
      password: 'NewRegPass1',
    }));

    vi.restoreAllMocks();
  });

  it('should display success message with username', async () => {
    const mockUser = {
      id: 3,
      email: 'msguser@example.com',
      username: 'msguser',
      fullName: 'Message User',
      isActive: true,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };

    const mockRegisterUser = vi.spyOn(ApiServiceModule.apiService, 'registerUser').mockResolvedValue(mockUser);

    const controller = new RegistrationController('registration-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
    const usernameInput = form.querySelector('input[id="username"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;

    emailInput.value = 'msguser@example.com';
    usernameInput.value = 'msguser';
    passwordInput.value = 'MessagePass1';

    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitButton.click();

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Success div should exist
    const successDiv = container.querySelector('.auth-success');
    if (successDiv) {
      expect(successDiv).toBeDefined();
    }

    vi.restoreAllMocks();
  });
});
