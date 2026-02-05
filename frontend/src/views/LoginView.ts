/**
 * Login form view.
 */
import { BaseView } from '@views/BaseView';

export class LoginView extends BaseView {
  private onSubmitCallback?: (data: Record<string, string>) => Promise<void>;

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
   * Render the login form.
   */
  render(): void {
    this.clear();

    const section = document.createElement('section');
    section.className = 'auth-section';

    const title = document.createElement('h2');
    title.textContent = 'Login to Your Account';
    title.className = 'section-title';

    const form = document.createElement('form');
    form.className = 'auth-form';
    form.id = 'login-form';

    // Create form fields
    form.appendChild(this.createFormField('email', 'email', 'Email', 'your.email@example.com'));
    form.appendChild(this.createFormField('password', 'password', 'Password', 'Your password'));

    // Submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Login';
    submitButton.className = 'btn btn-primary';

    form.appendChild(submitButton);

    // Register link
    const registerLink = document.createElement('p');
    registerLink.className = 'auth-link';
    registerLink.innerHTML = "Don't have an account? <a href=\"#\" id=\"go-to-register\">Register here</a>";

    section.appendChild(title);
    section.appendChild(form);
    section.appendChild(registerLink);

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
