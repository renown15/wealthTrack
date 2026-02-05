/**
 * Tests for ValidationService - Form validation
 */
import { describe, it, expect } from 'vitest';
import { ValidationService } from '../src/services/ValidationService';

describe('ValidationService - Form Validation', () => {
  describe('validateRegistrationForm', () => {
    it('should validate complete registration form', () => {
      const data = {
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        password: 'TestPass123',
      };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should reject form with missing email', () => {
      const data = { email: '', first_name: 'Test', last_name: 'User', password: 'TestPass123' };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });

    it('should reject form with invalid email', () => {
      const data = { email: 'invalid-email', first_name: 'Test', last_name: 'User', password: 'TestPass123' };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toContain('Invalid email');
    });

    it('should reject form with weak password', () => {
      const data = { email: 'test@example.com', first_name: 'Test', last_name: 'User', password: 'weak' };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });

    it('should reject form with missing first_name', () => {
      const data = { email: 'test@example.com', first_name: '', last_name: 'User', password: 'TestPass123' };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.first_name).toBeDefined();
    });

    it('should reject form with missing last_name', () => {
      const data = { email: 'test@example.com', first_name: 'Test', last_name: '', password: 'TestPass123' };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.last_name).toBeDefined();
    });

    it('should validate all required fields', () => {
      const data = { email: 'invalid', first_name: '', last_name: '', password: 'weak' };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(1);
    });

    it('should reject registration with first_name exceeding max length', () => {
      const data = {
        email: 'test@example.com',
        first_name: 'a'.repeat(101),
        last_name: 'User',
        password: 'TestPass123',
      };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.first_name).toBeDefined();
    });
  });

  describe('validateLoginForm', () => {
    it('should validate complete login form', () => {
      const data = { email: 'test@example.com', password: 'TestPass123' };
      const result = ValidationService.validateLoginForm(data);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should reject form with missing email', () => {
      const data = { email: '', password: 'TestPass123' };
      const result = ValidationService.validateLoginForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });

    it('should reject form with invalid email format', () => {
      const data = { email: 'invalid-email', password: 'TestPass123' };
      const result = ValidationService.validateLoginForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });

    it('should reject form with missing password', () => {
      const data = { email: 'test@example.com', password: '' };
      const result = ValidationService.validateLoginForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });

    it('should reject form with both fields missing', () => {
      const data = { email: '', password: '' };
      const result = ValidationService.validateLoginForm(data);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBe(2);
    });

    it('should validate any password in login form', () => {
      const data = { email: 'test@example.com', password: 'anypassword' };
      const result = ValidationService.validateLoginForm(data);
      expect(result.isValid).toBe(true);
    });

    it('should return empty errors object for valid form', () => {
      const data = { email: 'test@example.com', password: 'TestPass123' };
      const result = ValidationService.validateLoginForm(data);
      expect(result.errors).toEqual({});
    });
  });

  describe('ValidationResult structure', () => {
    it('should return ValidationResult with isValid and errors', () => {
      const data = { email: 'test@example.com', password: 'TestPass123' };
      const result = ValidationService.validateLoginForm(data);
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(typeof result.isValid).toBe('boolean');
      expect(typeof result.errors).toBe('object');
    });
  });
});
