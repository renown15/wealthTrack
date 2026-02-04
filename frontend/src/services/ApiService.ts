/**
 * API service for making HTTP requests to the backend.
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import type { User, UserRegistration, UserLogin, AuthToken, ApiError } from '../models/User';

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;

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
   * Register a new user.
   */
  async registerUser(userData: UserRegistration): Promise<User> {
    try {
      const response = await this.client.post<User>('/api/v1/auth/register', userData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        throw new Error(axiosError.response?.data?.detail || 'Registration failed');
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Login user and get access token.
   */
  async loginUser(credentials: UserLogin): Promise<AuthToken> {
    try {
      const response = await this.client.post<AuthToken>('/api/v1/auth/login', credentials);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        throw new Error(axiosError.response?.data?.detail || 'Login failed');
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
}

export const apiService = new ApiService();
