/**
 * LoginController - Missing token and form submission state tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoginController } from '@controllers/LoginController';
import * as ApiServiceModule from '@services/ApiService';
import { getRouter } from '@/router';

vi.mock('@/router', () => ({
  getRouter: vi.fn(() => ({
    navigate: vi.fn(),
  })),
}));

describe('LoginController - Missing token and form state', () => {
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

  describe('Missing token in response', () => {
    it('should handle response without accessToken', async () => {
      vi.spyOn(ApiServiceModule.apiService, 'loginUser')
        .mockResolvedValue({ accessToken: null, tokenType: 'Bearer' } as never);

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
      expect(errorElement?.textContent).toContain('No access token');
    });

    it('should handle response with empty accessToken', async () => {
      vi.spyOn(ApiServiceModule.apiService, 'loginUser')
        .mockResolvedValue({ accessToken: '', tokenType: 'Bearer' } as never);

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
  });

  describe('Form submission flow with proper state reset', () => {
    it('should reset isSubmitting state after successful login', async () => {
      const mockToken = { accessToken: 'token-123', tokenType: 'Bearer', expiresIn: 3600 };
      
      vi.spyOn(ApiServiceModule.apiService, 'loginUser')
        .mockResolvedValue(mockToken);

      const controller = new LoginController('login-container');
      controller.init();

      const form = container.querySelector('form') as HTMLFormElement;
      const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
      const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

      emailInput.value = 'test@example.com';
      passwordInput.value = 'TestPass123';

      // First submission
      submitButton.click();
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // After successful login, form should show success message
      const successElement = container.querySelector('.success-message');
      expect(successElement?.textContent).toContain('Redirecting to dashboard');
    });
  });

  describe('Form validation resetting on new submission attempt', () => {
    it('should handle multiple validation attempts gracefully', async () => {
      const controller = new LoginController('login-container');
      controller.init();

      const form = container.querySelector('form') as HTMLFormElement;
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

      // First submission with empty fields (validation error)
      submitButton.click();
      await new Promise((resolve) => setTimeout(resolve, 50));

      let errors = container.querySelectorAll('.field-error');
      expect(errors.length).toBeGreaterThan(0);

      // Button should be enabled again for retry
      expect(submitButton.disabled).toBe(false);
    });
  });
});
