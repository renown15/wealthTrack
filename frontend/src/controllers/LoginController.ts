/**
 * Login controller handling login logic.
 */
import { LoginView } from '@views/LoginView';
import { apiService } from '@services/ApiService';
import { ValidationService } from '@services/ValidationService';
import { debug } from '@utils/debug';
import type { UserLogin } from '@models/User';

export class LoginController {
  private view: LoginView;

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
    // Validate form data
    const validation = ValidationService.validateLoginForm(data);

    if (!validation.isValid) {
      this.view.displayErrors(validation.errors);
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

      // Store token
      if (authToken.accessToken) {
        debug.log('[Auth] Storing token:', authToken.accessToken.substring(0, 20) + '...');
        localStorage.setItem('accessToken', authToken.accessToken);
        apiService.setAuthToken(authToken.accessToken);
        debug.log('[Auth] Token stored successfully');
      } else {
        debug.error('[Auth] No accessToken in response:', authToken);
        throw new Error('No access token in login response');
      }

      // Show success message
      this.view.showSuccess('Login successful! Redirecting to dashboard...');

      // Redirect to dashboard after 1 second
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'dashboard' } }));
      }, 1000);
    } catch (error) {
      // Show error message
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      this.view.showError(errorMessage);
    }
  }
}
