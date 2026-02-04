/**
 * Base view class for rendering UI components.
 */
export abstract class BaseView {
  protected container: HTMLElement;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container with id '${containerId}' not found`);
    }
    this.container = element;
  }

  /**
   * Render the view.
   */
  abstract render(): void;

  /**
   * Clear the view container.
   */
  protected clear(): void {
    this.container.innerHTML = '';
  }

  /**
   * Show error message.
   */
  showError(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    this.container.insertBefore(errorDiv, this.container.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  /**
   * Show success message.
   */
  showSuccess(message: string): void {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    this.container.insertBefore(successDiv, this.container.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      successDiv.remove();
    }, 5000);
  }

  /**
   * Create form field with label and error display.
   */
  protected createFormField(
    type: string,
    name: string,
    label: string,
    placeholder?: string
  ): HTMLDivElement {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    const labelElement = document.createElement('label');
    labelElement.htmlFor = name;
    labelElement.textContent = label;

    const input = document.createElement('input');
    input.type = type;
    input.id = name;
    input.name = name;
    input.placeholder = placeholder || '';
    input.className = 'form-input';

    const errorSpan = document.createElement('span');
    errorSpan.className = 'field-error';
    errorSpan.id = `${name}-error`;

    fieldDiv.appendChild(labelElement);
    fieldDiv.appendChild(input);
    fieldDiv.appendChild(errorSpan);

    return fieldDiv;
  }

  /**
   * Display field-specific error.
   */
  protected displayFieldError(fieldName: string, error: string): void {
    const errorElement = document.getElementById(`${fieldName}-error`);
    if (errorElement) {
      errorElement.textContent = error;
      errorElement.style.display = 'block';
    }
  }

  /**
   * Clear all field errors.
   */
  protected clearFieldErrors(): void {
    const errorElements = this.container.querySelectorAll('.field-error');
    errorElements.forEach((element) => {
      (element as HTMLElement).textContent = '';
      (element as HTMLElement).style.display = 'none';
    });
  }
}
