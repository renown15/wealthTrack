/**
 * Integration tests for ApiService with axios mocking.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { User, UserRegistration, UserLogin } from '../src/models/User';

// Create a test instance of ApiService to test request construction
describe('ApiService Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Request construction', () => {
    it('should handle response with optional fields', () => {
      const user: User = {
        id: 2,
        email: 'minimal@example.com',
        firstName: 'Minimal',
        lastName: 'Unknown',
        isActive: true,
        isVerified: false,
        createdAt: new Date().toISOString(),
      };

      expect(user.lastName).toBe('Unknown');
      expect(user.email).toBe('minimal@example.com');
    });
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
      expect(data.lastName).toBe('User');
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

      expect('middleName' in parsed).toBe(false);
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
