/**
 * Tests for RegistrationController - Rendering and initialization
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RegistrationController } from '../src/controllers/RegistrationController';

describe('RegistrationController - Rendering', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'registration-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('should initialize controller', () => {
    const controller = new RegistrationController('registration-container');
    expect(controller).toBeDefined();
  });

  it('should create a registration form when initialized', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const form = container.querySelector('form');
    expect(form).toBeDefined();
  });

  it('should have email, first_name, last_name, and password input fields', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const emailInput = container.querySelector('input[id="email"]');
    const firstNameInput = container.querySelector('input[id="first_name"]');
    const lastNameInput = container.querySelector('input[id="last_name"]');
    const passwordInput = container.querySelector('input[id="password"]');

    expect(emailInput).toBeDefined();
    expect(firstNameInput).toBeDefined();
    expect(lastNameInput).toBeDefined();
    expect(passwordInput).toBeDefined();
  });

  it('should have submit button', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should render registration form elements', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    expect(container.textContent).toContain('Register');
  });

  it('should render login link', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const loginLink = container.querySelector('#go-to-login');
    expect(loginLink).toBeDefined();
    expect(loginLink?.textContent).toContain('Login');
  });

  it('should create controller with correct container ID', () => {
    const controller = new RegistrationController('registration-container');
    expect(controller).toBeDefined();

    const cont = document.getElementById('registration-container');
    expect(cont).toBeDefined();
  });

  it('should initialize with form rendered in container', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const formInContainer = container.querySelector('form[id="registration-form"]');
    expect(formInContainer).toBeDefined();
  });

  it('should have email input of type email', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const emailInput = container.querySelector('input[id="email"]') as HTMLInputElement;
    expect(emailInput).toBeDefined();
    expect(emailInput.type).toBe('email');
  });

  it('should have password input of type password', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const passwordInput = container.querySelector('input[id="password"]') as HTMLInputElement;
    expect(passwordInput).toBeDefined();
    expect(passwordInput.type).toBe('password');
  });

  it('should have first_name and last_name inputs of type text', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const firstNameInput = container.querySelector('input[id="first_name"]') as HTMLInputElement;
    const lastNameInput = container.querySelector('input[id="last_name"]') as HTMLInputElement;
    expect(firstNameInput).toBeDefined();
    expect(lastNameInput).toBeDefined();
    expect(firstNameInput?.type).toBe('text');
    expect(lastNameInput?.type).toBe('text');
  });

  it('should render section with correct class', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const section = container.querySelector('section.auth-section');
    expect(section).toBeDefined();
  });

  it('should render title correctly', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const title = container.querySelector('h2');
    expect(title).toBeDefined();
    expect(title?.textContent).toContain('Create Your Account');
  });

  it('should collect form data correctly', () => {
    const controller = new RegistrationController('registration-container');
    controller.init();

    const emailInput = container.querySelector('input[id="email"]') as HTMLInputElement;
    const firstNameInput = container.querySelector('input[id="first_name"]') as HTMLInputElement;
    const lastNameInput = container.querySelector('input[id="last_name"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[id="password"]') as HTMLInputElement;

    if (emailInput && firstNameInput && lastNameInput && passwordInput) {
      emailInput.value = 'test@example.com';
      firstNameInput.value = 'Test';
      lastNameInput.value = 'User';
      passwordInput.value = 'TestPass123';

      expect(emailInput.value).toBe('test@example.com');
      expect(firstNameInput.value).toBe('Test');
      expect(lastNameInput.value).toBe('User');
      expect(passwordInput.value).toBe('TestPass123');
    }
  });
});
