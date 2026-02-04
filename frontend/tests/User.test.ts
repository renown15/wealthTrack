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
        username: 'testuser',
        fullName: 'Test User',
        isActive: true,
        isVerified: false,
        createdAt: '2026-01-01T00:00:00Z',
      };

      expect(user.id).toBe(1);
      expect(user.email).toBe('test@example.com');
      expect(user.username).toBe('testuser');
      expect(user.isActive).toBe(true);
    });

    it('should allow null fullName', () => {
      const user: User = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        fullName: null,
        isActive: true,
        isVerified: false,
        createdAt: '2026-01-01T00:00:00Z',
      };

      expect(user.fullName).toBeNull();
    });
  });

  describe('UserRegistration', () => {
    it('should create valid registration data', () => {
      const registration: UserRegistration = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'SecurePass123',
        fullName: 'New User',
      };

      expect(registration.email).toBe('newuser@example.com');
      expect(registration.username).toBe('newuser');
      expect(registration.password).toBe('SecurePass123');
    });

    it('should allow optional fullName', () => {
      const registration: UserRegistration = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123',
      };

      expect(registration.fullName).toBeUndefined();
    });
  });

  describe('UserLogin', () => {
    it('should create valid login credentials', () => {
      const login: UserLogin = {
        username: 'testuser',
        password: 'SecurePass123',
      };

      expect(login.username).toBe('testuser');
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
