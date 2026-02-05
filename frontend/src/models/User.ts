/**
 * User model representing UserProfile data.
 */
export interface User {
  id: number;
  email: string;
  firstname: string;
  surname: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

/**
 * User registration data.
 */
export interface UserRegistration {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

/**
 * User login credentials.
 */
export interface UserLogin {
  email: string;
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
