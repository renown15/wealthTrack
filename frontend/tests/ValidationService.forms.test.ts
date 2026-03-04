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
        firstName: 'Test',
        lastName: 'User',
        password: 'TestPass123',
      };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should reject form with missing email', () => {
      const data = { email: '', firstName: 'Test', lastName: 'User', password: 'TestPass123' };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });

    it('should reject form with invalid email', () => {
      const data = { email: 'invalid-email', firstName: 'Test', lastName: 'User', password: 'TestPass123' };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toContain('Invalid email');
    });

    it('should reject form with missing password', () => {
      const data = { email: 'test@example.com', firstName: 'Test', lastName: 'User', password: '' };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });

    it('should reject form with missing firstName', () => {
      const data = { email: 'test@example.com', firstName: '', lastName: 'User', password: 'TestPass123' };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.firstName).toBeDefined();
    });

    it('should reject form with missing lastName', () => {
      const data = { email: 'test@example.com', firstName: 'Test', lastName: '', password: 'TestPass123' };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.lastName).toBeDefined();
    });

    it('should validate all required fields', () => {
      const data = { email: 'invalid', firstName: '', lastName: '', password: '' };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(1);
    });

    it('should reject registration with firstName exceeding max length', () => {
      const data = {
        email: 'test@example.com',
        firstName: 'a'.repeat(101),
        lastName: 'User',
        password: 'TestPass123',
      };
      const result = ValidationService.validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.firstName).toBeDefined();
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
