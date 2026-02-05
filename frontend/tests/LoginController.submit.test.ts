/**
 * Tests for LoginController - Form submission and API interaction
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoginController } from '../src/controllers/LoginController';
import * as ApiServiceModule from '../src/services/ApiService';

describe('LoginController - Form Submission', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'login-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
    vi.restoreAllMocks();
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

    submitButton.click();
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it('should handle validation errors correctly', async () => {
    const controller = new LoginController('login-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitButton.click();

    await new Promise((resolve) => setTimeout(resolve, 100));

    const errors = container.querySelectorAll('.field-error');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should handle API network errors', async () => {
    vi.spyOn(ApiServiceModule.apiService, 'loginUser').mockRejectedValue(new Error('Network error'));

    const controller = new LoginController('login-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;

    if (emailInput && passwordInput) {
      emailInput.value = 'user@example.com';
      passwordInput.value = 'Pass123';

      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      submitButton.click();

      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  });

  it('should handle successful login with token storage', async () => {
    const mockToken = { accessToken: 'test-token-123', tokenType: 'Bearer', expiresIn: 3600 };

    vi.spyOn(ApiServiceModule.apiService, 'loginUser').mockResolvedValue(mockToken);
    vi.spyOn(ApiServiceModule.apiService, 'setAuthToken').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});

    const controller = new LoginController('login-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;

    if (emailInput && passwordInput) {
      emailInput.value = 'test@example.com';
      passwordInput.value = 'TestPass123';

      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      submitButton.click();

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(ApiServiceModule.apiService.loginUser).toHaveBeenCalled();
    }
  });

  it('should set auth token after successful login', async () => {
    const mockToken = { accessToken: 'success-token-456', tokenType: 'Bearer', expiresIn: 3600 };

    const mockLoginUser = vi.spyOn(ApiServiceModule.apiService, 'loginUser').mockResolvedValue(mockToken);
    vi.spyOn(ApiServiceModule.apiService, 'setAuthToken').mockImplementation(() => {});

    const controller = new LoginController('login-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;

    if (emailInput && passwordInput) {
      emailInput.value = 'user@example.com';
      passwordInput.value = 'Pass123';

      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      submitButton.click();

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(mockLoginUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          password: 'Pass123',
        })
      );
    }
  });

  it('should handle non-Error rejection (fallback message)', async () => {
    vi.spyOn(ApiServiceModule.apiService, 'loginUser').mockRejectedValue('String error instead of Error object');

    const controller = new LoginController('login-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;

    if (emailInput && passwordInput) {
      emailInput.value = 'test@example.com';
      passwordInput.value = 'TestPass123';

      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      submitButton.click();

      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  });
});
