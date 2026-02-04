/**
 * Validation service for form inputs.
 */
import type { ValidationResult } from '../models/Form';

export class ValidationService {
  /**
   * Validate email format.
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength.
   */
  static validatePassword(password: string): { isValid: boolean; message?: string } {
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/\d/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one digit' };
    }
    return { isValid: true };
  }

  /**
   * Validate username format.
   */
  static validateUsername(username: string): { isValid: boolean; message?: string } {
    if (username.length < 3) {
      return { isValid: false, message: 'Username must be at least 3 characters' };
    }
    if (username.length > 50) {
      return { isValid: false, message: 'Username must be at most 50 characters' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return {
        isValid: false,
        message: 'Username must be alphanumeric (underscores allowed)',
      };
    }
    return { isValid: true };
  }

  /**
   * Validate full name format.
   */
  static validateFullName(fullName: string): { isValid: boolean; message?: string } {
    if (fullName && fullName.length > 100) {
      return { isValid: false, message: 'Full name must be at most 100 characters' };
    }
    return { isValid: true };
  }

  /**
   * Validate string field.
   */
  static validateString(
    value: string,
    minLength = 1,
    maxLength = 255,
  ): { isValid: boolean; message?: string } {
    if (value.length < minLength) {
      return { isValid: false, message: `Must be at least ${minLength} characters` };
    }
    if (value.length > maxLength) {
      return { isValid: false, message: `Must be at most ${maxLength} characters` };
    }
    return { isValid: true };
  }

  /**
   * Validate registration form data.
   */
  static validateRegistrationForm(data: Record<string, string>): ValidationResult {
    const errors: Record<string, string> = {};

    // Validate email
    if (!data.email) {
      errors.email = 'Email is required';
    } else if (!this.validateEmail(data.email)) {
      errors.email = 'Invalid email format';
    }

    // Validate username
    const usernameValidation = this.validateUsername(data.username || '');
    if (!data.username) {
      errors.username = 'Username is required';
    } else if (!usernameValidation.isValid) {
      errors.username = usernameValidation.message || 'Invalid username';
    }

    // Validate password
    const passwordValidation = this.validatePassword(data.password || '');
    if (!data.password) {
      errors.password = 'Password is required';
    } else if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message || 'Invalid password';
    }

    // Validate full name if provided
    if (data.fullName) {
      const nameValidation = this.validateFullName(data.fullName);
      if (!nameValidation.isValid) {
        errors.fullName = nameValidation.message || 'Invalid full name';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate login form data.
   */
  static validateLoginForm(data: Record<string, string>): ValidationResult {
    const errors: Record<string, string> = {};

    if (!data.username) {
      errors.username = 'Username is required';
    }

    if (!data.password) {
      errors.password = 'Password is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}
