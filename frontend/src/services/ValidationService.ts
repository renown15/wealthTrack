/**
 * Validation service for form inputs.
 */
import type { ValidationResult } from '@models/Form';

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
   * Validate first/last name format.
   */
  static validateName(name: string): { isValid: boolean; message?: string } {
    if (name.length < 1) {
      return { isValid: false, message: 'Name is required' };
    }
    if (name.length > 100) {
      return { isValid: false, message: 'Name must be at most 100 characters' };
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

    // Validate first name
    const firstNameValidation = this.validateName(data.firstName || '');
    if (!data.firstName) {
      errors.firstName = 'First name is required';
    } else if (!firstNameValidation.isValid) {
      errors.firstName = firstNameValidation.message || 'Invalid first name';
    }

    // Validate last name
    const lastNameValidation = this.validateName(data.lastName || '');
    if (!data.lastName) {
      errors.lastName = 'Last name is required';
    } else if (!lastNameValidation.isValid) {
      errors.lastName = lastNameValidation.message || 'Invalid last name';
    }

    // Validate password
    const passwordValidation = this.validatePassword(data.password || '');
    if (!data.password) {
      errors.password = 'Password is required';
    } else if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message || 'Invalid password';
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

    if (!data.email) {
      errors.email = 'Email is required';
    } else if (!this.validateEmail(data.email)) {
      errors.email = 'Invalid email format';
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
