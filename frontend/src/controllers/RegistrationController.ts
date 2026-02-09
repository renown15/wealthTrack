/**
 * Registration controller handling registration logic.
 */
import { RegistrationView } from '@views/RegistrationView';
import { apiService } from '@services/ApiService';
import { ValidationService } from '@services/ValidationService';
import { getRouter } from '@/router';
import type { UserRegistration } from '@models/User';

export class RegistrationController {
  private view: RegistrationView;
  private isSubmitting = false;

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
    // Prevent duplicate submissions
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.view.disableSubmit(true);
    
    // Validate form data
    const validation = ValidationService.validateRegistrationForm(data);

    if (!validation.isValid) {
      this.view.displayErrors(validation.errors);
      this.view.disableSubmit(false);
      this.isSubmitting = false;
      return;
    }

    // Prepare registration data
    const registrationData: UserRegistration = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
    };

    try {
      // Call API to register user
      const user = await apiService.registerUser(registrationData);

      // Show success message
      const message = `Registration successful! Welcome, ${user.firstName}. You can now log in.`;
      this.view.showSuccess(message);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        getRouter().navigate('login');
      }, 2000);
    } catch (error) {
      // Show error message
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