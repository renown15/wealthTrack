/**
 * Tests for ValidationService - Name and string validation
 */
import { describe, it, expect } from 'vitest';
import { ValidationService } from '../src/services/ValidationService';

describe('ValidationService - Name Validation', () => {
  describe('validateName', () => {
    it('should validate correct name', () => {
      const result = ValidationService.validateName('John Doe');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty name', () => {
      const result = ValidationService.validateName('');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('required');
    });

    it('should reject name exceeding max length', () => {
      const result = ValidationService.validateName('a'.repeat(101));
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('100 characters');
    });

    it('should accept name with exactly 1 character', () => {
      const result = ValidationService.validateName('A');
      expect(result.isValid).toBe(true);
    });

    it('should accept name with exactly 100 characters', () => {
      const result = ValidationService.validateName('a'.repeat(100));
      expect(result.isValid).toBe(true);
    });

    it('should accept names with spaces', () => {
      const result = ValidationService.validateName('John Michael Doe');
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

    it('should reject empty string with default min length', () => {
      const result = ValidationService.validateString('');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('1 characters');
    });

    it('should accept string exceeding default max if explicitly allowed', () => {
      const longString = 'a'.repeat(300);
      const result = ValidationService.validateString(longString, 1, 500);
      expect(result.isValid).toBe(true);
    });
  });
});
