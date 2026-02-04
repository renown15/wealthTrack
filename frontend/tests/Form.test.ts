/**
 * Tests for Form model.
 */
import { describe, it, expect } from 'vitest';
import type { FormField, FormErrors } from '../src/models/Form';

describe('Form Models', () => {
  describe('FormField', () => {
    it('should create valid form field', () => {
      const field: FormField = {
        name: 'email',
        type: 'email',
        label: 'Email',
        value: 'test@example.com',
      };

      expect(field.name).toBe('email');
      expect(field.value).toBe('test@example.com');
    });

    it('should handle empty value', () => {
      const field: FormField = {
        name: 'username',
        type: 'text',
        label: 'Username',
        value: '',
      };

      expect(field.value).toBe('');
      expect(field.value?.length).toBe(0);
    });
  });

  describe('FormErrors', () => {
    it('should create error object with field errors', () => {
      const errors: FormErrors = {
        email: 'Invalid email format',
        password: 'Password too short',
      };

      expect(errors.email).toBe('Invalid email format');
      expect(errors.password).toBe('Password too short');
    });

    it('should allow empty errors object', () => {
      const errors: FormErrors = {};

      expect(Object.keys(errors).length).toBe(0);
    });

    it('should add errors dynamically', () => {
      const errors: FormErrors = {};
      errors['username'] = 'Username already taken';

      expect(errors.username).toBe('Username already taken');
    });
  });
});
