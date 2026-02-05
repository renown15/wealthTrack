/**
 * Tests for ValidationService - Email validation
 */
import { describe, it, expect } from 'vitest';
import { ValidationService } from '../src/services/ValidationService';

describe('ValidationService - Email Validation', () => {
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
});
