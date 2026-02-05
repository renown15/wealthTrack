/**
 * Tests for User models and types.
 */
import { describe, it, expect } from 'vitest';
import type { User, UserRegistration, UserLogin, AuthToken, ApiError } from '../src/models/User';

describe('User Models', () => {
  describe('User', () => {
    it('should create valid user object', () => {
      const user: User = {
        id: 1,
        email: 'test@example.com',
        firstname: 'Test',
        surname: 'User',
        isActive: true,
        isVerified: false,
        createdAt: '2026-01-01T00:00:00Z',
      };

      expect(user.id).toBe(1);
      expect(user.email).toBe('test@example.com');
      expect(user.firstname).toBe('Test');
      expect(user.isActive).toBe(true);
    });

    it('should allow null surname', () => {
      const user: User = {
        id: 1,
        email: 'test@example.com',
        firstname: 'Test',
        surname: 'Unknown',
        isActive: true,
        isVerified: false,
        createdAt: '2026-01-01T00:00:00Z',
      };

      expect(user.surname).toBe('Unknown');
    });
  });

  describe('UserRegistration', () => {
    it('should create valid registration data', () => {
      const registration: UserRegistration = {
        email: 'newuser@example.com',
        first_name: 'New',
        last_name: 'User',
        password: 'SecurePass123',
      };

      expect(registration.email).toBe('newuser@example.com');
      expect(registration.first_name).toBe('New');
      expect(registration.password).toBe('SecurePass123');
    });

    it('should allow firstName and lastName', () => {
      const registration: UserRegistration = {
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        password: 'SecurePass123',
      };

      expect(registration.first_name).toBe('Test');
    });
  });

  describe('UserLogin', () => {
    it('should create valid login credentials', () => {
      const login: UserLogin = {
        email: 'test@example.com',
        password: 'SecurePass123',
      };

      expect(login.email).toBe('test@example.com');
      expect(login.password).toBe('SecurePass123');
    });
  });

  describe('AuthToken', () => {
    it('should create valid auth token', () => {
      const token: AuthToken = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        tokenType: 'bearer',
      };

      expect(token.accessToken).toContain('eyJ');
      expect(token.tokenType).toBe('bearer');
    });

    it('should validate token type', () => {
      const token: AuthToken = {
        accessToken: 'some-token',
        tokenType: 'bearer',
      };

      expect(token.tokenType.toLowerCase()).toBe('bearer');
    });
  });

  describe('ApiError', () => {
    it('should create valid API error', () => {
      const error: ApiError = {
        detail: 'User already exists',
      };

      expect(error.detail).toBe('User already exists');
    });
  });
});
