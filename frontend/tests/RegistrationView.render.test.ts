/**
 * Tests for RegistrationView - Rendering
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RegistrationView } from '../src/views/RegistrationView';

describe('RegistrationView - Rendering', () => {
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

  it('should initialize RegistrationView', () => {
    const view = new RegistrationView('test-container');
    expect(view).toBeDefined();
  });

  it('should render registration form', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const form = container.querySelector('form');
    expect(form).toBeDefined();
  });

  it('should have email input field', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const input = container.querySelector('input[id*="email"]');
    expect(input).toBeDefined();
  });

  it('should have username input field', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const input = container.querySelector('input[id*="username"]');
    expect(input).toBeDefined();
  });

  it('should have password input field', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const input = container.querySelector('input[id*="password"]');
    expect(input).toBeDefined();
  });

  it('should have fullName input field', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const input = container.querySelector('input[id*="fullName"]');
    expect(input).toBeDefined();
  });

  it('should have login link in form', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const loginLink = container.querySelector('#go-to-login');
    expect(loginLink).toBeDefined();
  });

  it('should have form with correct ID', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const form = container.querySelector('form#registration-form');
    expect(form).toBeDefined();
  });

  it('should render title with correct text', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const title = container.querySelector('h2');
    expect(title?.textContent).toContain('Create Your Account');
  });

  it('should have inputs with correct names', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
    const usernameInput = container.querySelector('input[name="username"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[name="password"]') as HTMLInputElement;
    const fullNameInput = container.querySelector('input[name="fullName"]') as HTMLInputElement;

    expect(emailInput).toBeDefined();
    expect(usernameInput).toBeDefined();
    expect(passwordInput).toBeDefined();
    expect(fullNameInput).toBeDefined();
  });

  it('should have submit button with correct text', () => {
    const view = new RegistrationView('test-container');
    view.render();

    const submitButton = container.querySelector('button[type="submit"]');
    expect(submitButton?.textContent).toBe('Register');
  });

  it('should clear container when rendering', () => {
    const view = new RegistrationView('test-container');

    container.innerHTML = '<p>Old content</p>';
    expect(container.innerHTML).toContain('Old content');

    view.render();
    expect(container.innerHTML).not.toContain('Old content');
  });
});
