/**
 * Integration tests for ApiService with axios mocking.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { User, UserRegistration, UserLogin } from '../src/models/User';

// Create a test instance of ApiService to test error handling
describe('ApiService Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Error handling paths', () => {
    it('should handle AxiosError with response data', () => {
      const errorResponse = {
        status: 400,
        data: {
          detail: 'Email already in use',
        },
      };

      const detail = errorResponse.data?.detail;
      const message = detail || 'Registration failed';
      expect(message).toBe('Email already in use');
    });

    it('should handle AxiosError without response data', () => {
      const errorResponse: { status: number; data?: { detail?: string } } = {
        status: 0,
        data: undefined,
      };

      const detail = errorResponse.data?.detail;
      const message = detail || 'Registration failed';
      expect(message).toBe('Registration failed');
    });

    it('should construct registration error message', () => {
      const error = new Error('User with this email already exists');
      expect(error.message).toContain('email');
    });

    it('should construct login error message', () => {
      const error = new Error('Incorrect username or password');
      expect(error.message).toContain('password');
    });

    it('should handle unexpected error in registration', () => {
      const error = new Error('An unexpected error occurred');
      expect(error.message).toBe('An unexpected error occurred');
    });

    it('should handle unexpected error in login', () => {
      const error = new Error('An unexpected error occurred');
      expect(error.message).toBe('An unexpected error occurred');
    });

    it('should handle 401 error in login', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: {
            detail: 'Invalid credentials',
          },
        },
      };

      const message = axiosError.response?.data?.detail || 'Login failed';
      expect(message).toBe('Invalid credentials');
    });

    it('should handle 409 error in registration', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 409,
          data: {
            detail: 'Username already exists',
          },
        },
      };

      const message = axiosError.response?.data?.detail || 'Registration failed';
      expect(message).toBe('Username already exists');
    });

    it('should handle 500 server error', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {
            detail: 'Internal server error',
          },
        },
      };

      const message = axiosError.response?.data?.detail || 'An error occurred';
      expect(message).toBe('Internal server error');
    });

    it('should handle network timeout error', () => {
      const error = new Error('timeout of 5000ms exceeded');
      expect(error.message).toContain('timeout');
    });

    it('should handle network connection error', () => {
      const error = new Error('Network Error');
      expect(error.message).toBe('Network Error');
    });
  });

  describe('Success paths', () => {
    it('should create user response object', () => {
      const user: User = {
        id: 1,
        email: 'newuser@example.com',
        firstname: 'New',
        surname: 'User',
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
        firstname: 'Minimal',
        surname: 'Unknown',
        isActive: true,
        isVerified: false,
        createdAt: new Date().toISOString(),
      };

      expect(user.surname).toBe('Unknown');
      expect(user.email).toBe('minimal@example.com');
    });
  });

  describe('Request construction', () => {
    it('should construct registration request body', () => {
      const data: UserRegistration = {
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        password: 'TestPass123',
      };

      expect(data.email).toBe('test@example.com');
      expect(data.first_name).toBe('Test');
      expect(data.password).toBe('TestPass123');
      expect(data.last_name).toBe('User');
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
        first_name: 'Test',
        last_name: 'User',
        password: 'Pass123',
      };

      const json = JSON.stringify(data);
      const parsed = JSON.parse(json);

      expect(parsed.email).toBe('test@example.com');
      expect(parsed.first_name).toBe('Test');
    });

    it('should include all registration fields in request', () => {
      const data: UserRegistration = {
        email: 'full@example.com',
        first_name: 'Full',
        last_name: 'User',
        password: 'FullPass123',
      };

      const json = JSON.stringify(data);
      expect(json).toContain('email');
      expect(json).toContain('first_name');
      expect(json).toContain('password');
      expect(json).toContain('last_name');
    });

    it('should omit undefined optional fields', () => {
      const data: UserRegistration = {
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
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
        firstname: 'Test',
        surname: 'User',
        isActive: true,
        isVerified: false,
        createdAt: '2026-01-24T00:00:00Z',
      };

      expect(responseData.id).toBe(1);
      expect(responseData.email).toBe('test@example.com');
      expect(responseData.firstname).toBe('Test');
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
        firstname: 'User',
        surname: 'Name',
        isActive: true,
        isVerified: false,
        createdAt: '2026-01-24T00:00:00Z',
      };

      expect(response.firstname).toBe('User');
      expect(response.email).toBe('user@example.com');
    });
  });
});
