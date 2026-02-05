/**
 * Tests for BaseView - Message display and form fields
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BaseView } from '../src/views/BaseView';

class TestView extends BaseView {
  render(): void {
    this.clear();
    const div = document.createElement('div');
    div.textContent = 'Test View';
    this.container.appendChild(div);
  }
}

describe('BaseView - Messages and Fields', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('should show error message', () => {
    const view = new TestView('test-container');
    view['showError']('Test error');

    const errorDiv = container.querySelector('.error-message');
    expect(errorDiv).toBeDefined();
    expect(errorDiv?.textContent).toBe('Test error');
  });

  it('should show success message', () => {
    const view = new TestView('test-container');
    view['showSuccess']('Test success');

    const successDiv = container.querySelector('.success-message');
    expect(successDiv).toBeDefined();
    expect(successDiv?.textContent).toBe('Test success');
  });

  it('should create form field', () => {
    const view = new TestView('test-container');
    const field = view['createFormField']('text', 'testField', 'Test Label', 'Test placeholder');

    expect(field.querySelector('label')).toBeDefined();
    expect(field.querySelector('input')).toBeDefined();
    expect(field.querySelector('.field-error')).toBeDefined();
  });

  it('should display field error', () => {
    const view = new TestView('test-container');
    const field = view['createFormField']('text', 'testField', 'Test Label');
    container.appendChild(field);

    view['displayFieldError']('testField', 'Test error message');

    const errorElement = container.querySelector('#testField-error') as HTMLElement;
    expect(errorElement.textContent).toBe('Test error message');
    expect(errorElement.style.display).toBe('block');
  });

  it('should insert messages at top of container', () => {
    const view = new TestView('test-container');
    view.render();

    const initialDiv = document.createElement('div');
    initialDiv.textContent = 'Initial content';
    container.appendChild(initialDiv);

    view['showError']('Error at top');

    const errorDiv = container.querySelector('.error-message');
    expect(errorDiv).toEqual(container.firstChild);
  });

  it('should auto-remove error messages', async () => {
    vi.useFakeTimers();

    const view = new TestView('test-container');
    view['showError']('Temporary error');

    const errorDiv = container.querySelector('.error-message');
    expect(errorDiv).toBeDefined();

    vi.advanceTimersByTime(5000);

    expect(container.querySelector('.error-message')).toBeNull();

    vi.useRealTimers();
  });

  it('should auto-remove success messages', async () => {
    vi.useFakeTimers();

    const view = new TestView('test-container');
    view['showSuccess']('Temporary success');

    const successDiv = container.querySelector('.success-message');
    expect(successDiv).toBeDefined();

    vi.advanceTimersByTime(5000);

    expect(container.querySelector('.success-message')).toBeNull();

    vi.useRealTimers();
  });

  it('should create form field with correct structure', () => {
    const view = new TestView('test-container');
    const field = view['createFormField']('email', 'emailField', 'Email Address', 'user@example.com');

    const label = field.querySelector('label') as HTMLLabelElement;
    const input = field.querySelector('input') as HTMLInputElement;
    const error = field.querySelector('.field-error') as HTMLElement;

    expect(label.htmlFor).toBe('emailField');
    expect(label.textContent).toBe('Email Address');
    expect(input.type).toBe('email');
    expect(input.id).toBe('emailField');
    expect(input.name).toBe('emailField');
    expect(input.placeholder).toBe('user@example.com');
    expect(error.id).toBe('emailField-error');
  });

  it('should handle password field creation', () => {
    const view = new TestView('test-container');
    const field = view['createFormField']('password', 'pwdField', 'Password');

    const input = field.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('should handle checkbox field creation', () => {
    const view = new TestView('test-container');
    const field = view['createFormField']('checkbox', 'rememberMe', 'Remember me');

    const input = field.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('checkbox');
  });

  it('should clear all field errors', () => {
    const view = new TestView('test-container');

    const field1 = view['createFormField']('text', 'field1', 'Field 1');
    const field2 = view['createFormField']('text', 'field2', 'Field 2');
    container.appendChild(field1);
    container.appendChild(field2);

    view['displayFieldError']('field1', 'Error 1');
    view['displayFieldError']('field2', 'Error 2');

    expect(container.querySelector('#field1-error')?.textContent).toBe('Error 1');
    expect(container.querySelector('#field2-error')?.textContent).toBe('Error 2');

    view['clearFieldErrors']();

    const errorElements = container.querySelectorAll('.field-error');
    errorElements.forEach((element) => {
      expect((element as HTMLElement).textContent).toBe('');
      expect((element as HTMLElement).style.display).toBe('none');
    });
  });

  it('should create field with div wrapper', () => {
    const view = new TestView('test-container');
    const field = view['createFormField']('text', 'testField', 'Test');

    expect(field.className).toBe('form-field');
  });

  it('should create input with form-input class', () => {
    const view = new TestView('test-container');
    const field = view['createFormField']('text', 'testField', 'Test');

    const input = field.querySelector('input') as HTMLInputElement;
    expect(input.className).toBe('form-input');
  });
});
