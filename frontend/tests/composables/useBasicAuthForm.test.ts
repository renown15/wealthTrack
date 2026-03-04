/**
 * Tests for useBasicAuthForm composable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBasicAuthForm } from '@composables/useBasicAuthForm';

// Mock dependencies
vi.mock('@/services/ApiService', () => ({
  apiService: {
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

vi.mock('@/modules/auth', () => ({
  authModule: {
    setToken: vi.fn(),
    setUser: vi.fn(),
  },
}));

vi.mock('@/utils/debug', () => ({
  debug: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

import { apiService } from '@/services/ApiService';
import { authModule } from '@/modules/auth';

describe('useBasicAuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialise with empty form', () => {
    const { form, errors, message, isSubmitting } = useBasicAuthForm();
    expect(form.firstName).toBe('');
    expect(form.lastName).toBe('');
    expect(form.email).toBe('');
    expect(form.password).toBe('');
    expect(errors.email).toBe('');
    expect(message.text).toBe('');
    expect(message.type).toBe('error');
    expect(isSubmitting.value).toBe(false);
  });

  describe('clearMessage', () => {
    it('should clear the message text', () => {
      const { message, showError, clearMessage } = useBasicAuthForm();
      showError('some error');
      clearMessage();
      expect(message.text).toBe('');
    });
  });

  describe('showError', () => {
    it('should set error message', () => {
      const { message, showError } = useBasicAuthForm();
      showError('Something went wrong');
      expect(message.text).toBe('Something went wrong');
      expect(message.type).toBe('error');
    });

    it('should auto-clear after 5 seconds', () => {
      const { message, showError } = useBasicAuthForm();
      showError('Error');
      vi.advanceTimersByTime(5000);
      expect(message.text).toBe('');
    });
  });

  describe('showSuccess', () => {
    it('should set success message', () => {
      const { message, showSuccess } = useBasicAuthForm();
      showSuccess('Done!');
      expect(message.text).toBe('Done!');
      expect(message.type).toBe('success');
    });

    it('should auto-clear after 5 seconds', () => {
      const { message, showSuccess } = useBasicAuthForm();
      showSuccess('Success');
      vi.advanceTimersByTime(5000);
      expect(message.text).toBe('');
    });
  });

  describe('clearErrors', () => {
    it('should clear all field errors', () => {
      const { errors, setErrors, clearErrors } = useBasicAuthForm();
      setErrors({ email: 'Bad email', password: 'Too short' });
      clearErrors();
      expect(errors.email).toBe('');
      expect(errors.password).toBe('');
    });
  });

  describe('setErrors', () => {
    it('should set specific field errors', () => {
      const { errors, setErrors } = useBasicAuthForm();
      setErrors({ email: 'Invalid email', firstName: 'Required' });
      expect(errors.email).toBe('Invalid email');
      expect(errors.firstName).toBe('Required');
      expect(errors.password).toBe('');
    });
  });

  describe('resetForm', () => {
    it('should clear all form fields', () => {
      const { form, resetForm } = useBasicAuthForm();
      form.email = 'test@test.com';
      form.password = 'pass';
      form.firstName = 'John';
      form.lastName = 'Doe';
      resetForm();
      expect(form.email).toBe('');
      expect(form.password).toBe('');
      expect(form.firstName).toBe('');
      expect(form.lastName).toBe('');
    });
  });

  describe('handleLogin', () => {
    it('should return failure if validation fails', async () => {
      const { handleLogin } = useBasicAuthForm();
      // form is empty (email/password missing) -> validation fails
      const result = await handleLogin();
      expect(result.success).toBe(false);
    });

    it('should set errors on validation failure', async () => {
      const { errors, handleLogin } = useBasicAuthForm();
      await handleLogin();
      expect(errors.email).toBeTruthy();
    });

    it('should call loginUser and getCurrentUser on success', async () => {
      vi.mocked(apiService.loginUser).mockResolvedValue({ accessToken: 'tok123' });
      vi.mocked(apiService.getCurrentUser).mockResolvedValue({ id: 1, email: 'a@b.com' });

      const { form, handleLogin } = useBasicAuthForm();
      form.email = 'test@example.com';
      form.password = 'password123';

      const result = await handleLogin();
      expect(result.success).toBe(true);
      expect(authModule.setToken).toHaveBeenCalledWith('tok123');
      expect(authModule.setUser).toHaveBeenCalled();
    });

    it('should throw if no accessToken in response', async () => {
      vi.mocked(apiService.loginUser).mockResolvedValue({});

      const { form, handleLogin } = useBasicAuthForm();
      form.email = 'test@example.com';
      form.password = 'password123';

      await expect(handleLogin()).rejects.toThrow('No access token');
    });
  });

  describe('handleRegister', () => {
    it('should return failure if validation fails', async () => {
      const { handleRegister } = useBasicAuthForm();
      const result = await handleRegister();
      expect(result.success).toBe(false);
    });

    it('should call registerUser on valid data', async () => {
      vi.mocked(apiService.registerUser).mockResolvedValue({ id: 1 });

      const { form, handleRegister } = useBasicAuthForm();
      form.email = 'test@example.com';
      form.firstName = 'Test';
      form.lastName = 'User';
      form.password = 'password';

      const result = await handleRegister();
      expect(result.success).toBe(true);
      expect(apiService.registerUser).toHaveBeenCalled();
    });
  });
});
