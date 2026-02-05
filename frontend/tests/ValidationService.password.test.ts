/**
 * Tests for ValidationService - Password validation
 */
import { describe, it, expect } from 'vitest';
import { ValidationService } from '../src/services/ValidationService';

describe('ValidationService - Password Validation', () => {
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
});
