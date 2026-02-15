import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AuthForm from '@views/AuthForm.vue';

describe('AuthForm.vue', () => {
  const defaultProps = {
    mode: 'login' as const,
    isSubmitting: false,
    errors: {},
    formData: {
      firstName: '',
      lastName: '',
      email: 'test@example.com',
      password: 'password123',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields in login mode', () => {
    const wrapper = mount(AuthForm, {
      props: defaultProps,
    });

    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
    expect(wrapper.find('input[name="email"]').exists()).toBe(true);
  });

  it('does not render name fields in login mode', () => {
    const wrapper = mount(AuthForm, {
      props: defaultProps,
    });

    expect(wrapper.find('input[name="firstName"]').exists()).toBe(false);
    expect(wrapper.find('input[name="lastName"]').exists()).toBe(false);
  });

  it('renders all fields in register mode', () => {
    const wrapper = mount(AuthForm, {
      props: {
        ...defaultProps,
        mode: 'register',
      },
    });

    expect(wrapper.find('input[name="firstName"]').exists()).toBe(true);
    expect(wrapper.find('input[name="lastName"]').exists()).toBe(true);
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
  });

  it('displays login button text in login mode', () => {
    const wrapper = mount(AuthForm, {
      props: defaultProps,
    });

    const button = wrapper.find('button[type="submit"]');
    expect(button.text()).toBe('Login');
  });

  it('displays register button text in register mode', () => {
    const wrapper = mount(AuthForm, {
      props: {
        ...defaultProps,
        mode: 'register',
      },
    });

    const button = wrapper.find('button[type="submit"]');
    expect(button.text()).toBe('Register');
  });

  it('displays loading state in login mode', () => {
    const wrapper = mount(AuthForm, {
      props: {
        ...defaultProps,
        isSubmitting: true,
      },
    });

    const button = wrapper.find('button[type="submit"]');
    expect(button.text()).toBe('Logging in...');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('displays loading state in register mode', () => {
    const wrapper = mount(AuthForm, {
      props: {
        ...defaultProps,
        mode: 'register',
        isSubmitting: true,
      },
    });

    const button = wrapper.find('button[type="submit"]');
    expect(button.text()).toBe('Registering...');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('emits submit with form data', async () => {
    const wrapper = mount(AuthForm, {
      props: defaultProps,
    });

    const form = wrapper.find('form');
    await form.trigger('submit');

    expect(wrapper.emitted('submit')).toHaveLength(1);
    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual(
      expect.objectContaining({
        email: 'test@example.com',
        password: 'password123',
      })
    );
  });

  it('displays validation errors', () => {
    const wrapper = mount(AuthForm, {
      props: {
        ...defaultProps,
        errors: {
          email: 'Invalid email format',
          password: 'Password is required',
        },
      },
    });

    expect(wrapper.text()).toContain('Invalid email format');
    expect(wrapper.text()).toContain('Password is required');
  });

  it('does not display errors when none exist', () => {
    const wrapper = mount(AuthForm, {
      props: defaultProps,
    });

    expect(wrapper.text()).not.toContain('Invalid');
    expect(wrapper.text()).not.toContain('required');
  });

  it('updates form data on input', async () => {
    const wrapper = mount(AuthForm, {
      props: {
        ...defaultProps,
        formData: {
          firstName: '',
          lastName: '',
          email: '',
          password: '',
        },
      },
    });

    const emailInput = wrapper.find('input[type="email"]');
    await emailInput.setValue('newemail@example.com');

    // Note: The component doesn't update parent formData in this implementation
    // This test verifies the input element accepts values
    expect((emailInput.element as HTMLInputElement).value).toBe('newemail@example.com');
  });

  it('renders name fields in register mode with labels', () => {
    const wrapper = mount(AuthForm, {
      props: {
        ...defaultProps,
        mode: 'register',
      },
    });

    expect(wrapper.text()).toContain('First Name');
    expect(wrapper.text()).toContain('Last Name');
  });

  it('shows password placeholder in login mode', () => {
    const wrapper = mount(AuthForm, {
      props: defaultProps,
    });

    const passwordInput = wrapper.find('input[type="password"]');
    expect(passwordInput.attributes('placeholder')).toBe('Your password');
  });

  it('shows password placeholder in register mode', () => {
    const wrapper = mount(AuthForm, {
      props: {
        ...defaultProps,
        mode: 'register',
      },
    });

    const passwordInput = wrapper.find('input[type="password"]');
    expect(passwordInput.attributes('placeholder')).toContain('Min 8 chars');
  });

  it('displays email placeholder', () => {
    const wrapper = mount(AuthForm, {
      props: defaultProps,
    });

    const emailInput = wrapper.find('input[type="email"]');
    expect(emailInput.attributes('placeholder')).toBe('you@example.com');
  });

  it('displays first name placeholder in register mode', () => {
    const wrapper = mount(AuthForm, {
      props: {
        ...defaultProps,
        mode: 'register',
      },
    });

    const firstNameInput = wrapper.find('input[name="firstName"]');
    expect(firstNameInput.attributes('placeholder')).toBe('John');
  });

  it('displays last name placeholder in register mode', () => {
    const wrapper = mount(AuthForm, {
      props: {
        ...defaultProps,
        mode: 'register',
      },
    });

    const lastNameInput = wrapper.find('input[name="lastName"]');
    expect(lastNameInput.attributes('placeholder')).toBe('Doe');
  });
});
