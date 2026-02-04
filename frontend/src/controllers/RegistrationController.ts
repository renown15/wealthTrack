/**
 * Registration controller handling registration logic.
 */
import { RegistrationView } from '../views/RegistrationView';
import { apiService } from '../services/ApiService';
import { ValidationService } from '../services/ValidationService';
import type { UserRegistration } from '../models/User';

export class RegistrationController {
  private view: RegistrationView;

  constructor(containerId: string) {
    this.view = new RegistrationView(containerId);
  }

  /**
   * Initialize the registration controller.
   */
  init(): void {
    this.view.render();
    this.view.onSubmit(async (data) => await this.handleRegistration(data));
  }

  /**
   * Handle user registration.
   */
  private async handleRegistration(data: Record<string, string>): Promise<void> {
    // Validate form data
    const validation = ValidationService.validateRegistrationForm(data);

    if (!validation.isValid) {
      this.view.displayErrors(validation.errors);
      return;
    }

    // Prepare registration data
    const registrationData: UserRegistration = {
      email: data.email,
      username: data.username,
      password: data.password,
      fullName: data.fullName || undefined,
    };

    try {
      // Call API to register user
      const user = await apiService.registerUser(registrationData);

      // Show success message
      this.view.showSuccess(
        `Registration successful! Welcome, ${user.username}. You can now log in.`
      );

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'login' } }));
      }, 2000);
    } catch (error) {
      // Show error message
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      this.view.showError(errorMessage);
    }
  }
}
