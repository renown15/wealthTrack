/**
 * Tests for ValidationService.
 */
import { describe, it, expect } from 'vitest';
import { ValidationService } from '../src/services/ValidationService';

describe('ValidationService', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(ValidationService.validateEmail('test@example.com')).toBe(true);
      expect(ValidationService.validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(ValidationService.validateEmail('invalid-email')).toBe(false);
      expect(ValidationService.validateEmail('missing@domain')).toBe(false);
      expect(ValidationService.validateEmail('@domain.com')).toBe(false);
    });

    it('should validate email with numbers', () => {
      expect(ValidationService.validateEmail('user123@example.com')).toBe(true);
    });

    it('should validate email with hyphens in domain', () => {
      expect(ValidationService.validateEmail('user@my-domain.com')).toBe(true);
    });

    it('should reject email with spaces', () => {
      expect(ValidationService.validateEmail('user @example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      const result = ValidationService.validatePassword('StrongPass123');
      expect(result.isValid).toBe(true);
    });

    it('should reject password without uppercase', () => {
      const result = ValidationService.validatePassword('weakpass123');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('uppercase');
    });

    it('should reject password without lowercase', () => {
      const result = ValidationService.validatePassword('WEAKPASS123');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('lowercase');
    });

    it('should reject password without digit', () => {
      const result = ValidationService.validatePassword('WeakPassword');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('digit');
    });

    it('should reject short password', () => {
      const result = ValidationService.validatePassword('Pass1');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('8 characters');
    });

    it('should accept long passwords', () => {
      const result = ValidationService.validatePassword('VeryLongPassword123WithManyCharacters');
      expect(result.isValid).toBe(true);
    });

    it('should accept password with exactly 8 characters', () => {
      const result = ValidationService.validatePassword('Pass1234');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateUsername', () => {
    it('should validate correct username', () => {
      const result = ValidationService.validateUsername('valid_user123');
      expect(result.isValid).toBe(true);
    });

    it('should reject short username', () => {
      const result = ValidationService.validateUsername('ab');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 3');
    });

    it('should reject long username', () => {
      const result = ValidationService.validateUsername('a'.repeat(51));
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at most 50');
    });

    it('should reject username with special characters', () => {
      const result = ValidationService.validateUsername('user@name');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('alphanumeric');
    });

    it('should accept username with underscores', () => {
      const result = ValidationService.validateUsername('user_name_123');
      expect(result.isValid).toBe(true);
    });

    it('should accept username with numbers', () => {
      const result = ValidationService.validateUsername('user123');
      expect(result.isValid).toBe(true);
    });

    it('should accept username with exactly 3 characters', () => {
      const result = ValidationService.validateUsername('abc');
      expect(result.isValid).toBe(true);
    });

    it('should accept username with exactly 50 characters', () => {
      const result = ValidationService.validateUsername('a'.repeat(50));
      expect(result.isValid).toBe(true);
    });

    it('should reject username with hyphens', () => {
      const result = ValidationService.validateUsername('user-name');
      expect(result.isValid).toBe(false);
    });

    it('should reject username with spaces', () => {
      const result = ValidationService.validateUsername('user name');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateRegistrationForm', () => {
    it('should validate complete registration form', () => {
      const data = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPass123',
        fullName: 'Test User',
      };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should reject form with missing email', () => {
      const data = {
        email: '',
        username: 'testuser',
        password: 'TestPass123',
      };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });

    it('should reject form with invalid email', () => {
      const data = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'TestPass123',
      };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toContain('Invalid email');
    });

    it('should reject form with weak password', () => {
      const data = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'weak',
      };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });

    it('should accept form without fullName', () => {
      const data = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPass123',
      };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(true);
    });

    it('should validate all required fields', () => {
      const data = {
        email: 'invalid',
        username: 'ab',
        password: 'weak',
      };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(1);
    });

    it('should validate password format in registration', () => {
      const data = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'NoDigits',
      };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });

    it('should validate username format in registration', () => {
      const data = {
        email: 'test@example.com',
        username: 'user@invalid',
        password: 'TestPass123',
      };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.username).toBeDefined();
    });
  });

  describe('validateLoginForm', () => {
    it('should validate complete login form', () => {
      const data = {
        username: 'testuser',
        password: 'TestPass123',
      };
      const result = ValidationService.validateLoginForm(data);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should reject form with missing username', () => {
      const data = {
        username: '',
        password: 'TestPass123',
      };
      const result = ValidationService.validateLoginForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.username).toBeDefined();
    });

    it('should reject form with missing password', () => {
      const data = {
        username: 'testuser',
        password: '',
      };
      const result = ValidationService.validateLoginForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });

    it('should reject form with both fields missing', () => {
      const data = {
        username: '',
        password: '',
      };
      const result = ValidationService.validateLoginForm(data);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBe(2);
    });

    it('should validate any password in login form', () => {
      const data = {
        username: 'testuser',
        password: 'anypassword',
      };
      const result = ValidationService.validateLoginForm(data);
      expect(result.isValid).toBe(true);
    });

    it('should validate any username in login form', () => {
      const data = {
        username: 'any-username-123',
        password: 'TestPass123',
      };
      const result = ValidationService.validateLoginForm(data);
      expect(result.isValid).toBe(true);
    });

    it('should return empty errors object for valid form', () => {
      const data = {
        username: 'testuser',
        password: 'TestPass123',
      };
      const result = ValidationService.validateLoginForm(data);
      expect(result.errors).toEqual({});
    });
  });

  describe('ValidationResult structure', () => {
    it('should return ValidationResult with isValid and errors', () => {
      const data = {
        username: 'testuser',
        password: 'TestPass123',
      };
      const result = ValidationService.validateLoginForm(data);
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(typeof result.isValid).toBe('boolean');
      expect(typeof result.errors).toBe('object');
    });
  });

  describe('validateFullName', () => {
    it('should validate short full name', () => {
      const result = ValidationService.validateFullName('John Doe');
      expect(result.isValid).toBe(true);
    });

    it('should validate long full name', () => {
      const result = ValidationService.validateFullName('John Michael Peter Anderson Smith');
      expect(result.isValid).toBe(true);
    });

    it('should reject full name exceeding max length', () => {
      const result = ValidationService.validateFullName('a'.repeat(101));
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('100 characters');
    });

    it('should allow empty full name', () => {
      const result = ValidationService.validateFullName('');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateString', () => {
    it('should validate string within bounds', () => {
      const result = ValidationService.validateString('hello', 1, 10);
      expect(result.isValid).toBe(true);
    });

    it('should reject string below minimum length', () => {
      const result = ValidationService.validateString('hi', 3, 10);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('3 characters');
    });

    it('should reject string exceeding maximum length', () => {
      const result = ValidationService.validateString('toolongstring', 1, 5);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('5 characters');
    });

    it('should use default min and max lengths', () => {
      const result = ValidationService.validateString('valid');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateRegistrationForm with fullName', () => {
    it('should validate complete registration with fullName', () => {
      const data = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPass123',
        fullName: 'Test User',
      };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should reject registration with invalid fullName', () => {
      const data = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPass123',
        fullName: 'a'.repeat(101),
      };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.fullName).toBeDefined();
    });

    it('should allow registration without fullName', () => {
      const data = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPass123',
      };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(true);
    });
  });
});
