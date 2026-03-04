/**
 * Tests for ValidationService - Password validation
 */
import { describe, it, expect } from 'vitest';
import { ValidationService } from '../src/services/ValidationService';

describe('ValidationService - Password Validation', () => {
  describe('validatePassword', () => {
    it('should validate any non-empty password', () => {
      const result = ValidationService.validatePassword('StrongPass123');
      expect(result.isValid).toBe(true);
    });

    it('should validate simple passwords', () => {
      const result = ValidationService.validatePassword('weakpass123');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty password', () => {
      const result = ValidationService.validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('should accept long passwords', () => {
      const result = ValidationService.validatePassword('VeryLongPassword123WithManyCharacters');
      expect(result.isValid).toBe(true);
    });

    it('should accept single character password', () => {
      const result = ValidationService.validatePassword('a');
      expect(result.isValid).toBe(true);
    });
  });
});
