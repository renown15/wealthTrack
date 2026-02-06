/**
 * Authentication service for user registration, login, and session management.
 */
import type { User, UserRegistration, UserLogin, AuthToken } from '@models/User';
import { BaseApiClient } from '@services/BaseApiClient';
import { debug } from '@utils/debug';

class AuthService extends BaseApiClient {
  /**
   * Register a new user.
   */
  async registerUser(userData: UserRegistration): Promise<User> {
    try {
      const response = await this.retryRequest(() =>
        this.client.post<User>('/api/v1/auth/register', userData),
      );
      debug.log('[Auth] Register response:', response.data);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Registration failed');
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
      debug.log('[Auth] Login response:', response.data);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Login failed');
    }
  }

  /**
   * Get current authenticated user.
   */
  async getCurrentUser(): Promise<User> {
    try {
      debug.log('[Auth] Fetching current user from /auth/me');
      const response = await this.retryRequest(() =>
        this.client.get<User>('/api/v1/auth/me'),
      );
      debug.log('[Auth] User response:', response.data);
      return response.data;
    } catch (error) {
      debug.error('[Auth] Failed to fetch current user:', error);
      throw this.handleError(error, 'Failed to fetch user');
    }
  }
}

export const authService = new AuthService();
