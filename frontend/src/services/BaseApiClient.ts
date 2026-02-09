/**
 * Base API client for HTTP requests with retry logic.
 * Simple, straightforward implementation without interceptors.
 */
import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import { debug } from '@utils/debug';
import type { ApiError } from '@models/User';

export class BaseApiClient {
  public client: AxiosInstance;
  protected baseURL: string;
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
    debug.log('[API] BaseApiClient initialized with baseURL:', this.baseURL);
    // Reduce retries to 1 for auth endpoints to fail fast instead of 7+ second delay
    this.maxRetries = 1;
  }

  /**
   * Retry logic with exponential backoff.
   */
  protected async retryRequest<T>(fn: () => Promise<T>, retries = 0): Promise<T> {
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
   * Handle API errors consistently.
   */
  protected handleError(error: unknown, fallback: string): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      
      // Try multiple paths to extract error message
      const detail = axiosError.response?.data?.detail 
        || (typeof axiosError.response?.data === 'string' ? axiosError.response.data : null)
        || axiosError.message 
        || fallback;
      
      return new Error(detail);
    }
    
    if (error instanceof Error) {
      return error;
    }
    return new Error(String(error) || 'An unexpected error occurred');
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
    const auth = this.client.defaults.headers.common['Authorization'] as string | undefined;
    return auth?.replace('Bearer ', '');
  }
}
