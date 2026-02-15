import { ref, type Ref } from 'vue';
import { apiService } from '@/services/ApiService';
import { ValidationService } from '@/services/ValidationService';
import { authModule } from '@/modules/auth';
import { debug } from '@/utils/debug';
import type { UserLogin, UserRegistration, User } from '@/models/User';

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface LoginForm extends Record<string, string | undefined> {
  email: string;
  password: string;
}

interface RegistrationForm extends Record<string, string | undefined> {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface UseAuthServiceReturn {
  isSubmitting: Ref<boolean>;
  handleLogin: (form: LoginForm) => Promise<AuthResult>;
  handleRegister: (form: RegistrationForm) => Promise<AuthResult>;
}

interface LoginForm extends Record<string, string | undefined> {
  email: string;
  password: string;
}

interface RegistrationForm extends Record<string, string | undefined> {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/**
 * API operations and auth service integration
 * Handles login/register with error handling
 */
export function useAuthService(): UseAuthServiceReturn {
  const isSubmitting: Ref<boolean> = ref(false);

  const handleLogin = async (form: LoginForm): Promise<AuthResult> => {
    try {
      isSubmitting.value = true;

      // Validate form
      const validation = ValidationService.validateLoginForm(form as Record<string, string>);
      if (!validation.isValid) {
        return {
          success: false,
          error: Object.values(validation.errors)[0] || 'Invalid form data',
        };
      }

      // Call API
      const loginData: UserLogin = {
        email: form.email,
        password: form.password,
      };

      const authToken = await apiService.loginUser(loginData);
      debug.log('[Auth] Login response received:', authToken);

      if (!authToken.accessToken) {
        debug.error('[Auth] No accessToken in response:', authToken);
        return {
          success: false,
          error: 'No access token in login response',
        };
      }

      // Store token
      debug.log(
        '[Auth] Storing token:',
        authToken.accessToken.substring(0, 20) + '...'
      );
      authModule.setToken(authToken.accessToken);

      // Fetch and store user
      const user = await apiService.getCurrentUser();
      authModule.setUser(user);

      return { success: true, user };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Login failed';
      debug.error('[Auth] Login error:', errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      isSubmitting.value = false;
    }
  };

  const handleRegister = async (form: RegistrationForm): Promise<AuthResult> => {
    try {
      isSubmitting.value = true;

      // Validate form
      const validation = ValidationService.validateRegistrationForm(form as Record<string, string>);
      if (!validation.isValid) {
        return {
          success: false,
          error: Object.values(validation.errors)[0] || 'Invalid form data',
        };
      }

      // Call API
      const registrationData: UserRegistration = {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password,
      };

      await apiService.registerUser(registrationData);
      debug.log('[Auth] Registration successful');

      return { success: true };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Registration failed';
      debug.error('[Auth] Registration error:', errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      isSubmitting.value = false;
    }
  };

  return {
    isSubmitting,
    handleLogin,
    handleRegister,
  };
}
