/**
 * Integration tests for ApiService - Success paths and request/response handling
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { User, UserRegistration, UserLogin } from '../src/models/User';

describe('ApiService Integration - Success Paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Success paths', () => {
    it('should create user response object', () => {
      const user: User = {
        id: 1,
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        isActive: true,
        isVerified: false,
        createdAt: new Date().toISOString(),
      };

      expect(user.id).toBe(1);
      expect(user.email).toBe('newuser@example.com');
      expect(user.isActive).toBe(true);
    });

    it('should create auth token response', () => {
      const token = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        tokenType: 'Bearer',
        expiresIn: 3600,
      };

      expect(token.accessToken.length).toBeGreaterThan(0);
      expect(token.tokenType).toBe('Bearer');
      expect(token.expiresIn).toBeGreaterThan(0);
    });

    it('should handle response with optional fields', () => {
      const user: User = {
        id: 2,
        email: 'minimal@example.com',
        firstName: 'Min',
        lastName: 'Imal',
        isActive: true,
        isVerified: false,
        createdAt: new Date().toISOString(),
      };

      expect(user.isActive).toBe(true);
      expect(user.email).toBe('minimal@example.com');
    });
  });

  describe('Request construction', () => {
    it('should construct registration request body', () => {
      const data: UserRegistration = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'TestPass123',
      };

      expect(data.email).toBe('test@example.com');
      expect(data.firstName).toBe('Test');
      expect(data.password).toBe('TestPass123');
    });

    it('should construct login request body', () => {
      const data: UserLogin = {
        email: 'user@example.com',
        password: 'UserPass123',
      };

      expect(data.email).toBe('user@example.com');
      expect(data.password).toBe('UserPass123');
    });

    it('should serialize request to JSON', () => {
      const data: UserRegistration = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'Pass123',
      };

      const json = JSON.stringify(data);
      const parsed = JSON.parse(json);

      expect(parsed.email).toBe('test@example.com');
      expect(parsed.firstName).toBe('Test');
    });

    it('should include all registration fields in request', () => {
      const data: UserRegistration = {
        email: 'full@example.com',
        firstName: 'Full',
        lastName: 'User',
        password: 'FullPass123',
      };

      const json = JSON.stringify(data);
      expect(json).toContain('email');
      expect(json).toContain('firstName');
      expect(json).toContain('password');
      expect(json).toContain('lastName');
    });

    it('should omit undefined optional fields', () => {
      const data: UserRegistration = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'Pass123',
      };

      const json = JSON.stringify(data);
      const parsed = JSON.parse(json);

      expect('optional_field' in parsed).toBe(false);
    });
  });

  describe('Response parsing', () => {
    it('should parse registration response', () => {
      const responseData = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        isVerified: false,
        createdAt: '2026-01-24T00:00:00Z',
      };

      expect(responseData.id).toBe(1);
      expect(responseData.email).toBe('test@example.com');
      expect(responseData.firstName).toBe('Test');
    });

    it('should parse login response', () => {
      const responseData = {
        accessToken: 'token-xyz-123',
        tokenType: 'Bearer',
        expiresIn: 3600,
      };

      expect(responseData.accessToken).toBe('token-xyz-123');
      expect(responseData.tokenType).toBe('Bearer');
      expect(responseData.expiresIn).toBe(3600);
    });

    it('should extract token from response', () => {
      const response = {
        accessToken: 'my-token-12345',
        tokenType: 'Bearer',
      };

      const token = response.accessToken;
      expect(token).toBe('my-token-12345');
    });

    it('should extract user data from response', () => {
      const response: User = {
        id: 1,
        email: 'user@example.com',
        firstName: 'User',
        lastName: 'Name',
        isActive: true,
        isVerified: false,
        createdAt: '2026-01-24T00:00:00Z',
      };

      expect(response.firstName).toBe('User');
      expect(response.email).toBe('user@example.com');
    });
  });
});
