import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthFormState } from '@/composables/useAuthFormState';

describe('useAuthFormState', () => {
  let formState: any;

  beforeEach(() => {
    formState = useAuthFormState();
  });

  describe('form initialization', () => {
    it('initializes with empty form fields', () => {
      expect(formState.form.firstName).toBe('');
      expect(formState.form.lastName).toBe('');
      expect(formState.form.email).toBe('');
      expect(formState.form.password).toBe('');
    });

    it('initializes with empty error fields', () => {
      expect(formState.errors.firstName).toBe('');
      expect(formState.errors.lastName).toBe('');
      expect(formState.errors.email).toBe('');
      expect(formState.errors.password).toBe('');
    });
  });

  describe('form updates', () => {
    it('updates form fields reactively', () => {
      formState.form.email = 'test@example.com';
      expect(formState.form.email).toBe('test@example.com');
    });

    it('supports updating all form fields', () => {
      formState.form.firstName = 'John';
      formState.form.lastName = 'Doe';
      formState.form.email = 'john@example.com';
      formState.form.password = 'secret123';

      expect(formState.form.firstName).toBe('John');
      expect(formState.form.lastName).toBe('Doe');
      expect(formState.form.email).toBe('john@example.com');
      expect(formState.form.password).toBe('secret123');
    });
  });

  describe('error management', () => {
    it('setErrors populates error object', () => {
      formState.setErrors({ email: 'Invalid email format' });
      expect(formState.errors.email).toBe('Invalid email format');
    });

    it('setErrors clears previous errors when setting new ones', () => {
      formState.setErrors({ email: 'First error' });
      expect(formState.errors.email).toBe('First error');

      formState.setErrors({ password: 'Password error' });
      expect(formState.errors.email).toBe('');
      expect(formState.errors.password).toBe('Password error');
    });

    it('setErrors handles multiple errors at once', () => {
      formState.setErrors({
        email: 'Invalid email',
        password: 'Too short',
        firstName: 'Required',
      });

      expect(formState.errors.email).toBe('Invalid email');
      expect(formState.errors.password).toBe('Too short');
      expect(formState.errors.firstName).toBe('Required');
    });

    it('clearErrors resets all error fields', () => {
      formState.setErrors({
        email: 'Error 1',
        password: 'Error 2',
      });

      formState.clearErrors();

      expect(formState.errors.firstName).toBe('');
      expect(formState.errors.lastName).toBe('');
      expect(formState.errors.email).toBe('');
      expect(formState.errors.password).toBe('');
    });

    it('ignores invalid field names in setErrors', () => {
      formState.setErrors({
        email: 'Valid error',
        unknownField: 'This should be ignored',
      } as any);

      expect(formState.errors.email).toBe('Valid error');
      expect((formState.errors as any).unknownField).toBeUndefined();
    });
  });

  describe('resetForm', () => {
    it('clears all form fields and errors', () => {
      formState.form.email = 'test@example.com';
      formState.form.password = 'secret123';
      formState.setErrors({ email: 'Invalid' });

      formState.resetForm();

      expect(formState.form.firstName).toBe('');
      expect(formState.form.lastName).toBe('');
      expect(formState.form.email).toBe('');
      expect(formState.form.password).toBe('');
      expect(formState.errors.email).toBe('');
    });

    it('resetForm is idempotent', () => {
      formState.resetForm();
      const formBefore = JSON.stringify(formState.form);

      formState.resetForm();
      const formAfter = JSON.stringify(formState.form);

      expect(formBefore).toBe(formAfter);
    });
  });
});
