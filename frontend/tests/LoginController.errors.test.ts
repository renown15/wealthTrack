import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoginController } from '@controllers/LoginController';
import * as ApiServiceModule from '@services/ApiService';
import { getRouter } from '@/router';

vi.mock('@/router', () => ({
  getRouter: vi.fn(() => ({
    navigate: vi.fn(),
  })),
}));

describe('LoginController - Error response handling', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'login-container';
    document.body.appendChild(container);
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (container && container.parentElement) {
      document.body.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  describe('Duplicate submission prevention', () => {
    it('should prevent duplicate submissions by returning early if already submitting', async () => {
      const mockToken = { accessToken: 'token-123', tokenType: 'Bearer', expiresIn: 3600 };
      const mockLoginUser = vi.spyOn(ApiServiceModule.apiService, 'loginUser')
        .mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return mockToken;
        });

      const controller = new LoginController('login-container');
      controller.init();

      const form = container.querySelector('form') as HTMLFormElement;
      const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
      const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;

      emailInput.value = 'test@example.com';
      passwordInput.value = 'TestPass123';

      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

      submitButton.click();
      submitButton.click();

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(mockLoginUser).toHaveBeenCalledTimes(1);
    });

    it('should disable submit button during submission', async () => {
      const mockToken = { accessToken: 'token-123', tokenType: 'Bearer', expiresIn: 3600 };
      
      vi.spyOn(ApiServiceModule.apiService, 'loginUser')
        .mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return mockToken;
        });

      const controller = new LoginController('login-container');
      controller.init();

      const form = container.querySelector('form') as HTMLFormElement;
      const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
      const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

      emailInput.value = 'test@example.com';
      passwordInput.value = 'TestPass123';

      submitButton.click();

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(submitButton.disabled).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });

  describe('Error response handling', () => {
    it('should handle API error with Error object message', async () => {
      const errorMessage = 'Invalid credentials';
      vi.spyOn(ApiServiceModule.apiService, 'loginUser')
        .mockRejectedValue(new Error(errorMessage));

      const controller = new LoginController('login-container');
      controller.init();

      const form = container.querySelector('form') as HTMLFormElement;
      const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
      const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

      emailInput.value = 'test@example.com';
      passwordInput.value = 'TestPass123';

      submitButton.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const errorElement = container.querySelector('.error-message');
      expect(errorElement?.textContent).toContain(errorMessage);
    });

    it('should handle string error rejection (non-Error object)', async () => {
      vi.spyOn(ApiServiceModule.apiService, 'loginUser')
        .mockRejectedValue('String error instead of Error');

      const controller = new LoginController('login-container');
      controller.init();

      const form = container.querySelector('form') as HTMLFormElement;
      const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
      const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

      emailInput.value = 'test@example.com';
      passwordInput.value = 'TestPass123';

      submitButton.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const errorElement = container.querySelector('.error-message');
      expect(errorElement).toBeDefined();
    });

    it('should handle error with empty message', async () => {
      vi.spyOn(ApiServiceModule.apiService, 'loginUser')
        .mockRejectedValue(new Error(''));

      const controller = new LoginController('login-container');
      controller.init();

      const form = container.querySelector('form') as HTMLFormElement;
      const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
      const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

      emailInput.value = 'test@example.com';
      passwordInput.value = 'TestPass123';

      submitButton.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const errorElement = container.querySelector('.error-message');
      expect(errorElement?.textContent).toContain('Login failed. Please try again.');
    });

    it('should handle error with whitespace-only message', async () => {
      vi.spyOn(ApiServiceModule.apiService, 'loginUser')
        .mockRejectedValue(new Error('   '));

      const controller = new LoginController('login-container');
      controller.init();

      const form = container.querySelector('form') as HTMLFormElement;
      const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
      const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

      emailInput.value = 'test@example.com';
      passwordInput.value = 'TestPass123';

      submitButton.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const errorElement = container.querySelector('.error-message');
      expect(errorElement?.textContent).toContain('Login failed. Please try again.');
    });

    it('should re-enable submit button after error', async () => {
      vi.spyOn(ApiServiceModule.apiService, 'loginUser')
        .mockRejectedValue(new Error('Network error'));

      const controller = new LoginController('login-container');
      controller.init();

      const form = container.querySelector('form') as HTMLFormElement;
      const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
      const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

      emailInput.value = 'test@example.com';
      passwordInput.value = 'TestPass123';

      submitButton.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(submitButton.disabled).toBe(false);
    });
  });
});

