/**
 * API service for making HTTP requests to the backend.
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import type { User, UserRegistration, UserLogin, AuthToken, ApiError } from '../models/User';
import type {
  Portfolio,
  Account,
  Institution,
  AccountCreateRequest,
  AccountUpdateRequest,
  InstitutionCreateRequest,
  InstitutionUpdateRequest,
} from '../models/Portfolio';

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

  /**
   * Get user portfolio with all accounts and institutions.
   */
  async getPortfolio(): Promise<Portfolio> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<Portfolio>('/api/v1/portfolio'),
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        const detail = axiosError.response?.data?.detail || 'Failed to fetch portfolio';
        throw new Error(detail);
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Get all accounts for current user.
   */
  async getAccounts(): Promise<Account[]> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<Account[]>('/api/v1/accounts'),
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        const detail = axiosError.response?.data?.detail || 'Failed to fetch accounts';
        throw new Error(detail);
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Get a specific account by ID.
   */
  async getAccount(accountId: number): Promise<Account> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<Account>(`/api/v1/accounts/${accountId}`),
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        const detail = axiosError.response?.data?.detail || 'Failed to fetch account';
        throw new Error(detail);
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Create a new account.
   */
  async createAccount(data: AccountCreateRequest): Promise<Account> {
    try {
      const response = await this.retryRequest(() =>
        this.client.post<Account>('/api/v1/accounts', data),
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        const detail = axiosError.response?.data?.detail || 'Failed to create account';
        throw new Error(detail);
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Update an existing account.
   */
  async updateAccount(accountId: number, data: AccountUpdateRequest): Promise<Account> {
    try {
      const response = await this.retryRequest(() =>
        this.client.put<Account>(`/api/v1/accounts/${accountId}`, data),
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        const detail = axiosError.response?.data?.detail || 'Failed to update account';
        throw new Error(detail);
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Delete an account.
   */
  async deleteAccount(accountId: number): Promise<void> {
    try {
      await this.retryRequest(() =>
        this.client.delete(`/api/v1/accounts/${accountId}`),
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        const detail = axiosError.response?.data?.detail || 'Failed to delete account';
        throw new Error(detail);
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Get all institutions for current user.
   */
  async getInstitutions(): Promise<Institution[]> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<Institution[]>('/api/v1/institutions'),
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        const detail = axiosError.response?.data?.detail || 'Failed to fetch institutions';
        throw new Error(detail);
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Get a specific institution by ID.
   */
  async getInstitution(institutionId: number): Promise<Institution> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<Institution>(`/api/v1/institutions/${institutionId}`),
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        const detail = axiosError.response?.data?.detail || 'Failed to fetch institution';
        throw new Error(detail);
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Create a new institution.
   */
  async createInstitution(data: InstitutionCreateRequest): Promise<Institution> {
    try {
      const response = await this.retryRequest(() =>
        this.client.post<Institution>('/api/v1/institutions', data),
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        const detail = axiosError.response?.data?.detail || 'Failed to create institution';
        throw new Error(detail);
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Update an existing institution.
   */
  async updateInstitution(
    institutionId: number,
    data: InstitutionUpdateRequest,
  ): Promise<Institution> {
    try {
      const response = await this.retryRequest(() =>
        this.client.put<Institution>(`/api/v1/institutions/${institutionId}`, data),
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        const detail = axiosError.response?.data?.detail || 'Failed to update institution';
        throw new Error(detail);
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Delete an institution.
   */
  async deleteInstitution(institutionId: number): Promise<void> {
    try {
      await this.retryRequest(() =>
        this.client.delete(`/api/v1/institutions/${institutionId}`),
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        const detail = axiosError.response?.data?.detail || 'Failed to delete institution';
        throw new Error(detail);
      }
      throw new Error('An unexpected error occurred');
    }
  }
}

export const apiService = new ApiService();
