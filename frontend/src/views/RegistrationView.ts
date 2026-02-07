/**
 * Registration form view.
 */
import { BaseView } from '@views/BaseView';

export class RegistrationView extends BaseView {
  private onSubmitCallback?: (data: Record<string, string>) => Promise<void>;
  private submitButton?: HTMLButtonElement;

  constructor(containerId: string) {
    super(containerId);
  }

  /**
   * Set the submit callback handler.
   */
  onSubmit(callback: (data: Record<string, string>) => Promise<void>): void {
    this.onSubmitCallback = callback;
  }

  /**
   * Disable/enable the submit button.
   */
  disableSubmit(disabled: boolean): void {
    if (this.submitButton) {
      this.submitButton.disabled = disabled;
      this.submitButton.textContent = disabled ? 'Registering...' : 'Register';
      this.submitButton.style.opacity = disabled ? '0.6' : '1';
      this.submitButton.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }
  }

  /**
   * Render the registration form.
   */
  render(): void {
    this.clear();

    const section = document.createElement('section');
    section.className = 'auth-section';

    const title = document.createElement('h2');
    title.textContent = 'Create Your Account';
    title.className = 'section-title';

    const form = document.createElement('form');
    form.className = 'auth-form';
    form.id = 'registration-form';

    // Create form fields
    form.appendChild(this.createFormField('email', 'email', 'Email', 'your.email@example.com'));
    form.appendChild(this.createFormField('text', 'firstName', 'First Name', 'John'));
    form.appendChild(this.createFormField('text', 'lastName', 'Last Name', 'Doe'));
    form.appendChild(this.createFormField('password', 'password', 'Password', 'Min 8 characters (Upper, Lower, Digit)'));

    // Submit button
    this.submitButton = document.createElement('button');
    this.submitButton.type = 'submit';
    this.submitButton.textContent = 'Register';
    this.submitButton.className = 'btn btn-primary';

    form.appendChild(this.submitButton);

    // Login link
    const loginLink = document.createElement('p');
    loginLink.className = 'auth-link';
    loginLink.innerHTML = 'Already have an account? <a href="#" id="go-to-login">Login here</a>';

    section.appendChild(title);
    section.appendChild(form);
    section.appendChild(loginLink);

    this.container.appendChild(section);

    // Attach event listeners
    form.addEventListener('submit', (e) => void this.handleSubmit(e));
  }

  /**
   * Handle form submission.
   */
  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.clearFieldErrors();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      data[key] = String(value);
    });

    if (this.onSubmitCallback) {
      await this.onSubmitCallback(data);
    }
  }

  /**
   * Display validation errors on form fields.
   */
  displayErrors(errors: Record<string, string>): void {
    Object.entries(errors).forEach(([field, error]) => {
      this.displayFieldError(field, error);
    });
  }
}
