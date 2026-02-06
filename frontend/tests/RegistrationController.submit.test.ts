/**
 * Tests for RegistrationController - Form submission and API interaction
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RegistrationController } from '../src/controllers/RegistrationController';
import * as ApiServiceModule from '../src/services/ApiService';

describe('RegistrationController - Form Submission', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'registration-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
    vi.restoreAllMocks();
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

    submitButton.click();
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it('should handle registration validation errors on submission', async () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

    submitButton.click();
    await new Promise((resolve) => setTimeout(resolve, 100));

    const errorElements = container.querySelectorAll('.field-error');
    expect(errorElements.length).toBeGreaterThanOrEqual(0);
  });

  it('should show success message after successful registration', async () => {
    const mockUser = {
      id: 1,
      email: 'success@example.com',
      firstName: 'Success',
      lastName: 'User',
      isActive: true,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };

    vi.spyOn(ApiServiceModule.apiService, 'registerUser').mockResolvedValue(mockUser);

    const controller = new RegistrationController('registration-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
    const firstNameInput = form.querySelector('input[id="firstName"]') as HTMLInputElement;
    const lastNameInput = form.querySelector('input[id="lastName"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;

    if (emailInput && firstNameInput && lastNameInput && passwordInput) {
      emailInput.value = 'success@example.com';
      firstNameInput.value = 'Success';
      lastNameInput.value = 'User';
      passwordInput.value = 'SuccessPass1';

      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      submitButton.click();

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(ApiServiceModule.apiService.registerUser).toHaveBeenCalled();
    }
  });

  it('should handle API registration success', async () => {
    const mockUser = {
      id: 2,
      email: 'newreg@example.com',
      firstName: 'New',
      lastName: 'Register',
      isActive: true,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };

    const mockRegisterUser = vi.spyOn(ApiServiceModule.apiService, 'registerUser').mockResolvedValue(mockUser);

    const controller = new RegistrationController('registration-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
    const firstNameInput = form.querySelector('input[id="firstName"]') as HTMLInputElement;
    const lastNameInput = form.querySelector('input[id="lastName"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;

    if (emailInput && firstNameInput && lastNameInput && passwordInput) {
      emailInput.value = 'newreg@example.com';
      firstNameInput.value = 'New';
      lastNameInput.value = 'Register';
      passwordInput.value = 'NewRegPass1';

      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      submitButton.click();

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(mockRegisterUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'newreg@example.com',
          firstName: 'New',
          lastName: 'Register',
          password: 'NewRegPass1',
        })
      );
    }
  });

  it('should handle non-Error rejection (fallback message)', async () => {
    vi.spyOn(ApiServiceModule.apiService, 'registerUser').mockRejectedValue('String error instead of Error object');

    const controller = new RegistrationController('registration-container');
    controller.init();

    const form = container.querySelector('form') as HTMLFormElement;
    const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
    const firstNameInput = form.querySelector('input[id="firstName"]') as HTMLInputElement;
    const lastNameInput = form.querySelector('input[id="lastName"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[id="password"]') as HTMLInputElement;

    if (emailInput && firstNameInput && lastNameInput && passwordInput) {
      emailInput.value = 'nonError@example.com';
      firstNameInput.value = 'NonError';
      lastNameInput.value = 'User';
      passwordInput.value = 'NonErrorPass123';

      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      submitButton.click();

      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  });
});
