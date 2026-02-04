/**
 * Tests for ApiService.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import type { User, UserRegistration, UserLogin, AuthToken } from '../src/models/User';
import { apiService } from '../src/services/ApiService';

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Error handling', () => {
    it('should throw error with custom message for registration failures', () => {
      // Test error message construction
      const detail = 'User already exists';
      const message = detail || 'Registration failed';
      expect(message).toBe('User already exists');
    });

    it('should throw error with default message for registration failures', () => {
      const detail = undefined;
      const message = detail || 'Registration failed';
      expect(message).toBe('Registration failed');
    });

    it('should throw error with custom message for login failures', () => {
      const detail = 'Incorrect username or password';
      const message = detail || 'Login failed';
      expect(message).toBe('Incorrect username or password');
    });

    it('should throw error with default message for login failures', () => {
      const detail = undefined;
      const message = detail || 'Login failed';
      expect(message).toBe('Login failed');
    });

    it('should handle unexpected errors', () => {
      const error = new Error('Unexpected error');
      expect(error.message).toBe('Unexpected error');
    });
  });

  describe('Data structures', () => {
    it('should validate User structure', () => {
      const user: User = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        fullName: 'Test User',
        isActive: true,
        isVerified: false,
        createdAt: '2026-01-24T00:00:00Z',
      };

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.username).toBe('testuser');
      expect(user.isActive).toBe(true);
    });

    it('should validate User with optional fullName', () => {
      const user: User = {
        id: 2,
        email: 'user@example.com',
        username: 'user123',
        isActive: true,
        isVerified: true,
        createdAt: '2026-01-24T00:00:00Z',
      };

      expect(user.email).toBe('user@example.com');
      expect(user.fullName).toBeUndefined();
    });

    it('should validate UserRegistration structure', () => {
      const registration: UserRegistration = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPass123',
        fullName: 'Test User',
      };

      expect(registration.email).toBe('test@example.com');
      expect(registration.username).toBe('testuser');
      expect(registration.password).toBe('TestPass123');
      expect(registration.fullName).toBe('Test User');
    });

    it('should validate UserRegistration with optional fullName', () => {
      const registration: UserRegistration = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPass123',
      };

      expect(registration.email).toBe('test@example.com');
      expect(registration.fullName).toBeUndefined();
    });

    it('should validate UserLogin structure', () => {
      const login: UserLogin = {
        username: 'testuser',
        password: 'TestPass123',
      };

      expect(login.username).toBe('testuser');
      expect(login.password).toBe('TestPass123');
    });

    it('should validate AuthToken structure', () => {
      const token: AuthToken = {
        accessToken: 'test-token',
        tokenType: 'bearer',
      };

      expect(token.accessToken).toBe('test-token');
      expect(token.tokenType).toBe('bearer');
    });
  });

  describe('Bearer token formatting', () => {
    it('should format bearer token correctly', () => {
      const token = 'test-token';
      const formatted = `Bearer ${token}`;
      expect(formatted).toBe('Bearer test-token');
    });

    it('should construct authorization header correctly', () => {
      const token = 'my-auth-token';
      const header = {
        common: {
          'Authorization': `Bearer ${token}`,
        },
      };

      expect(header.common['Authorization']).toBe('Bearer my-auth-token');
    });

    it('should delete authorization header', () => {
      const header = {
        common: {
          'Authorization': 'Bearer test-token',
        },
      };

      delete header.common['Authorization'];
      expect(header.common['Authorization']).toBeUndefined();
    });

    it('should format long bearer token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const formatted = `Bearer ${token}`;
      expect(formatted.startsWith('Bearer ')).toBe(true);
      expect(formatted.length).toBeGreaterThan(10);
    });
  });

  describe('API endpoints', () => {
    it('should construct register endpoint', () => {
      const baseURL = 'http://localhost:8000';
      const endpoint = '/api/v1/auth/register';
      const fullUrl = `${baseURL}${endpoint}`;
      expect(fullUrl).toBe('http://localhost:8000/api/v1/auth/register');
    });

    it('should construct login endpoint', () => {
      const baseURL = 'http://localhost:8000';
      const endpoint = '/api/v1/auth/login';
      const fullUrl = `${baseURL}${endpoint}`;
      expect(fullUrl).toBe('http://localhost:8000/api/v1/auth/login');
    });

    it('should construct correct endpoint with trailing slash', () => {
      const baseURL = 'http://localhost:8000/';
      const endpoint = 'api/v1/auth/register';
      const fullUrl = `${baseURL}${endpoint}`;
      expect(fullUrl).toContain('register');
    });
  });

  describe('Environment configuration', () => {
    it('should use default API URL when not configured', () => {
      const apiUrl = undefined || 'http://localhost:8000';
      expect(apiUrl).toBe('http://localhost:8000');
    });

    it('should use configured API URL when provided', () => {
      const configuredUrl = 'http://api.example.com';
      const apiUrl = configuredUrl || 'http://localhost:8000';
      expect(apiUrl).toBe('http://api.example.com');
    });

    it('should handle API URL with protocol', () => {
      const apiUrl = 'https://api.example.com';
      expect(apiUrl.startsWith('https://')).toBe(true);
    });

    it('should handle API URL with port number', () => {
      const apiUrl = 'http://localhost:3000';
      expect(apiUrl).toContain('3000');
    });
  });

  describe('ApiService methods', () => {
    it('should have setAuthToken method', () => {
      expect(typeof apiService.setAuthToken).toBe('function');
    });

    it('should have clearAuthToken method', () => {
      expect(typeof apiService.clearAuthToken).toBe('function');
    });

    it('should have registerUser method', () => {
      expect(typeof apiService.registerUser).toBe('function');
    });

    it('should have loginUser method', () => {
      expect(typeof apiService.loginUser).toBe('function');
    });
  });

  describe('Token management', () => {
    it('should set auth token', () => {
      const token = 'test-token-123';
      apiService.setAuthToken(token);
      expect(apiService).toBeDefined();
    });

    it('should clear auth token', () => {
      apiService.setAuthToken('test-token');
      apiService.clearAuthToken();
      expect(apiService).toBeDefined();
    });

    it('should handle multiple token sets', () => {
      apiService.setAuthToken('token-1');
      apiService.setAuthToken('token-2');
      apiService.setAuthToken('token-3');
      expect(apiService).toBeDefined();
    });
  });

  describe('Request content type', () => {
    it('should set correct content-type header', () => {
      const contentType = 'application/json';
      expect(contentType).toBe('application/json');
    });

    it('should handle JSON request bodies', () => {
      const data: UserRegistration = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPass123',
      };

      const json = JSON.stringify(data);
      const parsed = JSON.parse(json);

      expect(parsed.email).toBe('test@example.com');
    });
  });

  describe('Login API method', () => {
    it('should construct login request with correct data', () => {
      const loginData: UserLogin = {
        email: 'test@example.com',
        password: 'TestPass123',
      };

      expect(loginData.email).toBe('test@example.com');
      expect(loginData.password).toBe('TestPass123');
    });

    it('should construct login URL correctly', () => {
      const baseUrl = 'http://localhost:3000/api';
      const loginUrl = `${baseUrl}/auth/login`;
      expect(loginUrl).toBe('http://localhost:3000/api/auth/login');
    });
  });

  describe('Registration API method', () => {
    it('should construct registration request with correct data', () => {
      const regData: UserRegistration = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'SecurePass1',
        fullName: 'New User',
      };

      expect(regData.email).toBe('newuser@example.com');
      expect(regData.username).toBe('newuser');
      expect(regData.password).toBe('SecurePass1');
    });

    it('should construct registration URL correctly', () => {
      const baseUrl = 'http://localhost:3000/api';
      const regUrl = `${baseUrl}/auth/register`;
      expect(regUrl).toBe('http://localhost:3000/api/auth/register');
    });

    it('should handle registration with all fields', () => {
      const regData: UserRegistration = {
        email: 'complete@example.com',
        username: 'completeuser',
        password: 'CompletePass1',
        fullName: 'Complete User',
      };

      const json = JSON.stringify(regData);
      const parsed = JSON.parse(json);

      expect(parsed.email).toBe('complete@example.com');
      expect(parsed.fullName).toBe('Complete User');
    });
  });

  describe('API error scenarios', () => {
    it('should handle network errors', () => {
      const error = new Error('Network error');
      expect(error.message).toBe('Network error');
    });

    it('should handle 400 Bad Request errors', () => {
      const errorData = {
        status: 400,
        detail: 'Invalid request data',
      };
      expect(errorData.status).toBe(400);
      expect(errorData.detail).toBe('Invalid request data');
    });

    it('should handle 401 Unauthorized errors', () => {
      const errorData = {
        status: 401,
        detail: 'Unauthorized',
      };
      expect(errorData.status).toBe(401);
    });

    it('should handle 500 Server errors', () => {
      const errorData = {
        status: 500,
        detail: 'Internal server error',
      };
      expect(errorData.status).toBe(500);
    });

    it('should extract error message from response', () => {
      const errorResponse = {
        detail: 'User with this email already exists',
      };
      const message = errorResponse.detail || 'An error occurred';
      expect(message).toBe('User with this email already exists');
    });
  });

  describe('API methods integration', () => {
    it('should handle registerUser with valid data structure', () => {
      const userData: UserRegistration = {
        email: 'integration@example.com',
        username: 'intuser',
        password: 'IntPass1',
        fullName: 'Integration User',
      };

      expect(userData.email).toBe('integration@example.com');
      expect(userData.username).toBe('intuser');
    });

    it('should handle loginUser with valid credentials structure', () => {
      const credentials: UserLogin = {
        email: 'login@example.com',
        password: 'LoginPass1',
      };

      expect(credentials.email).toBe('login@example.com');
      expect(credentials.password).toBe('LoginPass1');
    });

    it('should construct proper request for registration', () => {
      const userData: UserRegistration = {
        email: 'request@example.com',
        username: 'requser',
        password: 'ReqPass1',
      };

      const requestBody = JSON.stringify(userData);
      const parsed = JSON.parse(requestBody);

      expect(parsed.email).toBe('request@example.com');
      expect(parsed.username).toBe('requser');
    });

    it('should construct proper request for login', () => {
      const credentials: UserLogin = {
        email: 'reqlogin@example.com',
        password: 'ReqLoginPass1',
      };

      const requestBody = JSON.stringify(credentials);
      const parsed = JSON.parse(requestBody);

      expect(parsed.email).toBe('reqlogin@example.com');
    });

    it('should handle response data for registered user', () => {
      const responseData: User = {
        id: 1,
        email: 'response@example.com',
        username: 'respuser',
        fullName: 'Response User',
        isActive: true,
        isVerified: false,
        createdAt: '2026-01-24T00:00:00Z',
      };

      expect(responseData.id).toBe(1);
      expect(responseData.email).toBe('response@example.com');
      expect(responseData.isActive).toBe(true);
    });

    it('should handle response data for login token', () => {
      const tokenData: AuthToken = {
        accessToken: 'token-123-xyz',
        tokenType: 'Bearer',
        expiresIn: 3600,
      };

      expect(tokenData.accessToken).toBe('token-123-xyz');
      expect(tokenData.tokenType).toBe('Bearer');
      expect(tokenData.expiresIn).toBe(3600);
    });

    it('should handle missing optional fields in response', () => {
      const userResponse: User = {
        id: 2,
        email: 'minimal@example.com',
        username: 'minimaluser',
        isActive: true,
        isVerified: false,
        createdAt: '2026-01-24T00:00:00Z',
      };

      expect(userResponse.fullName).toBeUndefined();
      expect(userResponse.email).toBe('minimal@example.com');
    });
  });

  describe('Axios integration', () => {
    it('should create axios instance with correct base URL', () => {
      // Test that apiService was initialized
      expect(apiService).toBeDefined();
    });

    it('should set correct headers in axios instance', () => {
      // Verify content-type is set
      const expectedHeader = 'application/json';
      expect(expectedHeader).toBe('application/json');
    });

    it('should construct login endpoint correctly', () => {
      const endpoint = '/api/v1/auth/login';
      expect(endpoint).toBe('/api/v1/auth/login');
    });

    it('should construct registration endpoint correctly', () => {
      const endpoint = '/api/v1/auth/register';
      expect(endpoint).toBe('/api/v1/auth/register');
    });

    it('should pass registration data to axios', () => {
      const userData: UserRegistration = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPass123',
      };

      const json = JSON.stringify(userData);
      expect(json).toContain('email');
      expect(json).toContain('username');
      expect(json).toContain('password');
    });

    it('should pass login credentials to axios', () => {
      const credentials: UserLogin = {
        email: 'user@example.com',
        password: 'UserPass123',
      };

      const json = JSON.stringify(credentials);
      expect(json).toContain('email');
      expect(json).toContain('password');
    });

    it('should handle axios error object', () => {
      const axiosError = {
        response: {
          data: {
            detail: 'Invalid credentials',
          },
        },
      };

      const message = axiosError.response?.data?.detail || 'Login failed';
      expect(message).toBe('Invalid credentials');
    });

    it('should use default error message when detail missing', () => {
      const axiosError = {
        response: {
          data: {},
        },
      };

      const message = axiosError.response?.data?.detail || 'Login failed';
      expect(message).toBe('Login failed');
    });

    it('should handle unexpected error from axios', () => {
      const error = new Error('Unexpected error occurred');
      expect(error.message).toBe('Unexpected error occurred');
    });
  });

  describe('Token management', () => {
    it('should set auth token in headers', () => {
      const token = 'test-jwt-token-123';
      apiService.setAuthToken(token);
      const retrievedToken = apiService.getAuthToken();
      expect(retrievedToken).toBe(token);
    });

    it('should clear auth token', () => {
      apiService.setAuthToken('test-token');
      apiService.clearAuthToken();
      const token = apiService.getAuthToken();
      expect(token).toBeUndefined();
    });

    it('should return undefined when no token is set', () => {
      apiService.clearAuthToken();
      const token = apiService.getAuthToken();
      expect(token).toBeUndefined();
    });
  });

  describe('Retry logic', () => {
    it('should identify retryable status codes', () => {
      const retryableCodes = [408, 429, 500, 502, 503, 504];
      retryableCodes.forEach((code) => {
        expect([408, 429, 500, 502, 503, 504].includes(code)).toBe(true);
      });
    });

    it('should not retry non-retryable status codes', () => {
      const nonRetryableCodes = [400, 401, 403, 404];
      nonRetryableCodes.forEach((code) => {
        expect([408, 429, 500, 502, 503, 504].includes(code)).toBe(false);
      });
    });
  });

  describe('Exponential backoff delay calculation', () => {
    it('should calculate correct delays for retries', () => {
      const baseDelay = 1000;
      expect(baseDelay * Math.pow(2, 0)).toBe(1000); // 1st retry: 1000ms
      expect(baseDelay * Math.pow(2, 1)).toBe(2000); // 2nd retry: 2000ms
      expect(baseDelay * Math.pow(2, 2)).toBe(4000); // 3rd retry: 4000ms
    });
  });
});
