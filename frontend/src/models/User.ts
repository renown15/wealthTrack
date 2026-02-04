/**
 * User model representing user data.
 */
export interface User {
  id: number;
  email: string;
  username: string;
  fullName: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

/**
 * User registration data.
 */
export interface UserRegistration {
  email: string;
  username: string;
  password: string;
  fullName?: string;
}

/**
 * User login credentials.
 */
export interface UserLogin {
  email?: string;
  username?: string;
  password: string;
}

/**
 * Authentication token response.
 */
export interface AuthToken {
  accessToken: string;
  tokenType: string;
}

/**
 * API error response.
 */
export interface ApiError {
  detail: string;
}
