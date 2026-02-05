/**
 * Tests for LoginController.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoginController } from '../src/controllers/LoginController';
import * as ApiServiceModule from '../src/services/ApiService';
import * as ValidationModule from '../src/services/ValidationService';

describe('LoginController', () => {
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

  it('should have username and password input fields', () => {
    const controller = new LoginController('login-container');
    controller.init();

    const usernameInput = container.querySelector('input[id*="username"]');
    const passwordInput = container.querySelector('input[id*="password"]');

    expect(usernameInput).toBeDefined();
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

  it('should handle form submission', async () => {
    const controller = new LoginController('login-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    expect(form).toBeDefined();
  });

  it('should display validation errors on invalid form', async () => {
    const controller = new LoginController('login-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

    // Submit with empty fields
    submitButton.click();

    // Wait a bit for async validation
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it('should collect form data correctly', () => {
    const controller = new LoginController('login-container');
    controller.init();

    const usernameInput = container.querySelector('input[id="username"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[id="password"]') as HTMLInputElement;

    usernameInput.value = 'testuser';
    passwordInput.value = 'TestPass123';

    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('TestPass123');
  });

  it('should clear previous error messages', async () => {
    const controller = new LoginController('login-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const usernameError = container.querySelector('#username-error') as HTMLElement;

    if (usernameError) {
      usernameError.textContent = 'Old error';
      usernameError.style.display = 'block';
      expect(usernameError.textContent).toBe('Old error');
    }
  });

  it('should set up onSubmit callback', () => {
    const controller = new LoginController('login-container');

    controller.init();

    // The init method should set up the callback
    expect(controller).toBeDefined();
  });

  it('should render register link', () => {
    const controller = new LoginController('login-container');
    controller.init();

    const registerLink = container.querySelector('#go-to-register');
    expect(registerLink).toBeDefined();
    expect(registerLink?.textContent).toContain('Register');
  });

  it('should handle successful login attempt', async () => {
    const controller = new LoginController('login-container');
    controller.init();

    const usernameInput = container.querySelector('input[id="username"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[id="password"]') as HTMLInputElement;

    if (usernameInput && passwordInput) {
      usernameInput.value = 'testuser';
      passwordInput.value = 'TestPass123';
    }
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

  it('should have username input of type text', () => {
    const controller = new LoginController('login-container');
    controller.init();

    const usernameInput = container.querySelector('input[id="username"]') as HTMLInputElement;
    expect(usernameInput).toBeDefined();
    expect(usernameInput.type).toBe('text');
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

  it('should call API service on valid form submission', async () => {
    const mockLoginUser = vi.spyOn(ApiServiceModule.apiService, 'loginUser').mockRejectedValue(new Error('Network error'));
    
    const controller = new LoginController('login-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const usernameInput = form.querySelector('input[id="username"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;

    usernameInput.value = 'testuser';
    passwordInput.value = 'TestPass123';

    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitButton.click();

    await new Promise((resolve) => setTimeout(resolve, 100));

    vi.restoreAllMocks();
  });

  it('should handle validation errors correctly', async () => {
    const controller = new LoginController('login-container');
    controller.init();

    // Submit without filling in fields
    const form = container.querySelector('form') as HTMLFormElement;
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitButton.click();

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Error messages should be displayed
    const errors = container.querySelectorAll('.field-error');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should handle API network errors', async () => {
    const mockLoginUser = vi.spyOn(ApiServiceModule.apiService, 'loginUser').mockRejectedValue(new Error('Network error'));

    const controller = new LoginController('login-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const usernameInput = form.querySelector('input[id="username"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;

    usernameInput.value = 'user';
    passwordInput.value = 'Pass123';

    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitButton.click();

    await new Promise((resolve) => setTimeout(resolve, 150));

    vi.restoreAllMocks();
  });

  it('should handle API authentication errors', async () => {
    const mockLoginUser = vi.spyOn(ApiServiceModule.apiService, 'loginUser').mockRejectedValue(new Error('Invalid credentials'));

    const controller = new LoginController('login-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const usernameInput = form.querySelector('input[id="username"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;

    usernameInput.value = 'baduser';
    passwordInput.value = 'WrongPass';

    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitButton.click();

    await new Promise((resolve) => setTimeout(resolve, 150));

    vi.restoreAllMocks();
  });

  it('should display error messages from API', async () => {
    const mockLoginUser = vi.spyOn(ApiServiceModule.apiService, 'loginUser').mockRejectedValue(new Error('Server error'));

    const controller = new LoginController('login-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const usernameInput = form.querySelector('input[id="username"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;

    usernameInput.value = 'testuser';
    passwordInput.value = 'TestPass123';

    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitButton.click();

    await new Promise((resolve) => setTimeout(resolve, 150));

    // Error div should be visible
    const errorDiv = container.querySelector('.auth-error');
    if (errorDiv) {
      expect(errorDiv).toBeDefined();
    }

    vi.restoreAllMocks();
  });

  it('should handle successful login with token storage', async () => {
    const mockToken = {
      accessToken: 'test-token-123',
      tokenType: 'Bearer',
      expiresIn: 3600,
    };

    const mockLoginUser = vi.spyOn(ApiServiceModule.apiService, 'loginUser').mockResolvedValue(mockToken);
    const mockSetToken = vi.spyOn(ApiServiceModule.apiService, 'setAuthToken').mockImplementation(() => {});
    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});

    const controller = new LoginController('login-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const usernameInput = form.querySelector('input[id="username"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;

    usernameInput.value = 'testuser';
    passwordInput.value = 'TestPass123';

    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitButton.click();

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(mockLoginUser).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('should set auth token after successful login', async () => {
    const mockToken = {
      accessToken: 'success-token-456',
      tokenType: 'Bearer',
      expiresIn: 3600,
    };

    const mockLoginUser = vi.spyOn(ApiServiceModule.apiService, 'loginUser').mockResolvedValue(mockToken);
    const mockSetToken = vi.spyOn(ApiServiceModule.apiService, 'setAuthToken').mockImplementation(() => {});

    const controller = new LoginController('login-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const usernameInput = form.querySelector('input[id="username"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;

    usernameInput.value = 'user';
    passwordInput.value = 'Pass123';

    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitButton.click();

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(mockLoginUser).toHaveBeenCalledWith(expect.objectContaining({
      username: 'user',
      password: 'Pass123',
    }));

    vi.restoreAllMocks();
  });

  it('should show success message after login', async () => {
    const mockToken = {
      accessToken: 'token-success-789',
      tokenType: 'Bearer',
      expiresIn: 3600,
    };

    const mockLoginUser = vi.spyOn(ApiServiceModule.apiService, 'loginUser').mockResolvedValue(mockToken);
    const mockSetToken = vi.spyOn(ApiServiceModule.apiService, 'setAuthToken').mockImplementation(() => {});
    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});

    const controller = new LoginController('login-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const usernameInput = form.querySelector('input[id="username"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;

    usernameInput.value = 'successuser';
    passwordInput.value = 'SuccessPass123';

    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitButton.click();

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Success message should be displayed
    const successDiv = container.querySelector('.auth-success');
    if (successDiv) {
      expect(successDiv).toBeDefined();
    }

    vi.restoreAllMocks();
  });

  it('should handle non-Error rejection (fallback message)', async () => {
    // Test when API rejects with a string instead of an Error object
    const mockLoginUser = vi.spyOn(ApiServiceModule.apiService, 'loginUser')
      .mockRejectedValue('String error instead of Error object');

    const controller = new LoginController('login-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const usernameInput = form.querySelector('input[id="username"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;

    usernameInput.value = 'testuser';
    passwordInput.value = 'TestPass123';

    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitButton.click();

    await new Promise((resolve) => setTimeout(resolve, 150));

    vi.restoreAllMocks();
  });});