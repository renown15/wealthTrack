/**
 * Combined authentication controller handling login and registration.
 */
import { AuthView, type AuthMode } from '@views/AuthView';
import { apiService } from '@services/ApiService';
import { ValidationService } from '@services/ValidationService';
import { authModule } from '@/modules/auth';
import { getRouter } from '@/router';
import { debug } from '@utils/debug';
import type { UserLogin, UserRegistration } from '@models/User';

export class AuthController {
  private view: AuthView;
  private isSubmitting = false;
  private initialMode: AuthMode;

  constructor(containerId: string, mode: AuthMode = 'login') {
    this.view = new AuthView(containerId);
    this.initialMode = mode;
  }

  init(): void {
    this.view.setMode(this.initialMode);
    this.view.onLogin(async (data) => await this.handleLogin(data));
    this.view.onRegister(async (data) => await this.handleRegistration(data));
  }

  private async handleLogin(data: Record<string, string>): Promise<void> {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.view.disableSubmit(true);

    const validation = ValidationService.validateLoginForm(data);

    if (!validation.isValid) {
      this.view.displayErrors(validation.errors);
      this.view.disableSubmit(false);
      this.isSubmitting = false;
      return;
    }

    const loginData: UserLogin = {
      email: data.email,
      password: data.password,
    };

    try {
      const authToken = await apiService.loginUser(loginData);
      debug.log('[Auth] Login response received:', authToken);

      if (authToken.accessToken) {
        debug.log('[Auth] Storing token:', authToken.accessToken.substring(0, 20) + '...');
        authModule.setToken(authToken.accessToken);
        debug.log('[Auth] Token stored successfully');
      } else {
        debug.error('[Auth] No accessToken in response:', authToken);
        throw new Error('No access token in login response');
      }

      this.view.showSuccess('Login successful! Redirecting to dashboard...');

      setTimeout(() => {
        getRouter().navigate('dashboard');
      }, 1000);
    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage || errorMessage.trim().length === 0) {
        errorMessage = 'Login failed. Please try again.';
      }
      this.view.showError(errorMessage);
      this.view.disableSubmit(false);
      this.isSubmitting = false;
    }
  }

  private async handleRegistration(data: Record<string, string>): Promise<void> {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.view.disableSubmit(true);

    const validation = ValidationService.validateRegistrationForm(data);

    if (!validation.isValid) {
      this.view.displayErrors(validation.errors);
      this.view.disableSubmit(false);
      this.isSubmitting = false;
      return;
    }

    const registrationData: UserRegistration = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
    };

    try {
      const user = await apiService.registerUser(registrationData);

      this.view.showSuccess(`Registration successful! Welcome, ${user.firstName}. Logging you in...`);

      // Auto-login after registration
      setTimeout(() => {
        this.view.setMode('login');
      }, 2000);
    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage || errorMessage.trim().length === 0) {
        errorMessage = 'Registration failed. Please try again.';
      }
      this.view.showError(errorMessage);
      this.view.disableSubmit(false);
      this.isSubmitting = false;
    }
  }
}
