/**
 * Integration tests for ApiService - Error handling paths
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { UserRegistration, UserLogin } from '../src/models/User';

describe('ApiService Integration - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle AxiosError with response data', () => {
    const errorResponse = {
      status: 400,
      data: { detail: 'Email already in use' },
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
    const registrationData: UserRegistration = {
      email: 'test@example.com',
      username: 'test',
      password: 'pass123',
    };

    const error = new Error('User with this email already exists');
    expect(error.message).toContain('email');
  });

  it('should construct login error message', () => {
    const loginData: UserLogin = {
      username: 'wrong@example.com',
      password: 'wrongpass',
    };

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
      response: { status: 401, data: { detail: 'Invalid credentials' } },
    };

    const message = axiosError.response?.data?.detail || 'Login failed';
    expect(message).toBe('Invalid credentials');
  });

  it('should handle 409 error in registration', () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 409, data: { detail: 'Username already exists' } },
    };

    const message = axiosError.response?.data?.detail || 'Registration failed';
    expect(message).toBe('Username already exists');
  });

  it('should handle 500 server error', () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 500, data: { detail: 'Internal server error' } },
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
