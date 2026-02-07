/**
 * Registration controller handling registration logic.
 */
import { RegistrationView } from '@views/RegistrationView';
import { apiService } from '@services/ApiService';
import { ValidationService } from '@services/ValidationService';
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
      console.log('[Registration] Submission already in progress, ignoring duplicate');
      return;
    }

    this.isSubmitting = true;
    console.log('[Registration] Form submitted with data:', data);
    this.view.disableSubmit(true);
    
    // Validate form data
    const validation = ValidationService.validateRegistrationForm(data);

    if (!validation.isValid) {
      console.log('[Registration] Validation errors:', validation.errors);
      this.view.displayErrors(validation.errors);
      this.view.disableSubmit(false);
      this.isSubmitting = false;
      return;
    }

    console.log('[Registration] Validation passed');

    // Prepare registration data
    const registrationData: UserRegistration = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
    };

    try {
      console.log('[Registration] Calling registerUser API...');
      // Call API to register user
      const user = await apiService.registerUser(registrationData);

      console.log('[Registration] API response:', user);

      // Show success message
      const message = `Registration successful! Welcome, ${user.firstName}. You can now log in.`;
      console.log('[Registration] Showing success message:', message);
      this.view.showSuccess(message);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        console.log('[Registration] Redirecting to login...');
        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'login' } }));
      }, 2000);
    } catch (error) {
      // Show error message
      console.error('[Registration] Error occurred:', error);
      console.error('[Registration] Error type:', typeof error);
      if (error instanceof Error) {
        console.error('[Registration] Error.message:', error.message);
        console.error('[Registration] Error.name:', error.name);
        console.error('[Registration] Error.stack:', error.stack);
      }
      let errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage || errorMessage.trim().length === 0) {
        errorMessage = 'Registration failed. Please try again.';
      }
      console.log('[Registration] Showing error message:', errorMessage);
      this.view.showError(errorMessage);
      this.view.disableSubmit(false);
      this.isSubmitting = false;
    }
  }
}
