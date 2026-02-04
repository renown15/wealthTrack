/**
 * API service for making HTTP requests to the backend.
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import type { User, UserRegistration, UserLogin, AuthToken, ApiError } from '../models/User';

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Retry logic with exponential backoff.
   */
  private async retryRequest<T>(
    fn: () => Promise<T>,
    retries = 0,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries < this.maxRetries && this.isRetryableError(error)) {
        const delay = this.retryDelay * Math.pow(2, retries);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.retryRequest(fn, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable.
   */
  private isRetryableError(error: unknown): boolean {
    if (!axios.isAxiosError(error)) return false;
    const status = error.response?.status;
    return status ? [408, 429, 500, 502, 503, 504].includes(status) : true;
  }

  /**
   * Register a new user.
   */
  async registerUser(userData: UserRegistration): Promise<User> {
    try {
      const response = await this.retryRequest(() =>
        this.client.post<User>('/api/v1/auth/register', userData),
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        const detail = axiosError.response?.data?.detail || 'Registration failed';
        throw new Error(detail);
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Login user and get access token.
   */
  async loginUser(credentials: UserLogin): Promise<AuthToken> {
    try {
      const response = await this.retryRequest(() =>
        this.client.post<AuthToken>('/api/v1/auth/login', credentials),
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        const detail = axiosError.response?.data?.detail || 'Login failed';
        throw new Error(detail);
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Get current authenticated user.
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<User>('/api/v1/auth/me'),
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        const detail = axiosError.response?.data?.detail || 'Failed to fetch user';
        throw new Error(detail);
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Set authentication token for future requests.
   */
  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear authentication token.
   */
  clearAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }

  /**
   * Get current auth token from headers.
   */
  getAuthToken(): string | undefined {
    const auth = this.client.defaults.headers.common['Authorization'] as
      | string
      | undefined;
    return auth?.replace('Bearer ', '');
  }
}

export const apiService = new ApiService();
