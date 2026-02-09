/**
 * Login controller handling login logic.
 */
import { LoginView } from '@views/LoginView';
import { apiService } from '@services/ApiService';
import { ValidationService } from '@services/ValidationService';
import { authModule } from '@/modules/auth';
import { getRouter } from '@/router';
import { debug } from '@utils/debug';
import type { UserLogin } from '@models/User';

export class LoginController {
  private view: LoginView;
  private isSubmitting = false;

  constructor(containerId: string) {
    this.view = new LoginView(containerId);
  }

  /**
   * Initialize the login controller.
   */
  init(): void {
    this.view.render();
    this.view.onSubmit(async (data) => await this.handleLogin(data));
  }

  /**
   * Handle user login.
   */
  private async handleLogin(data: Record<string, string>): Promise<void> {
    // Prevent duplicate submissions
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.view.disableSubmit(true);

    // Validate form data
    const validation = ValidationService.validateLoginForm(data);

    if (!validation.isValid) {
      this.view.displayErrors(validation.errors);
      this.view.disableSubmit(false);
      this.isSubmitting = false;
      return;
    }

    // Prepare login data
    const loginData: UserLogin = {
      email: data.email,
      password: data.password,
    };

    try {
      // Call API to login user
      const authToken = await apiService.loginUser(loginData);
      debug.log('[Auth] Login response received:', authToken);

      // Store token and update auth state
      if (authToken.accessToken) {
        debug.log('[Auth] Storing token:', authToken.accessToken.substring(0, 20) + '...');
        authModule.setToken(authToken.accessToken);
        debug.log('[Auth] Token stored successfully');
      } else {
        debug.error('[Auth] No accessToken in response:', authToken);
        throw new Error('No access token in login response');
      }

      // Show success message
      this.view.showSuccess('Login successful! Redirecting to dashboard...');

      // Redirect to dashboard after 1 second
      setTimeout(() => {
        getRouter().navigate('dashboard');
      }, 1000);
    } catch (error) {
      // Show error message
      let errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage || errorMessage.trim().length === 0) {
        errorMessage = 'Login failed. Please try again.';
      }
      this.view.showError(errorMessage);
      this.view.disableSubmit(false);
      this.isSubmitting = false;
    }
  }
}
