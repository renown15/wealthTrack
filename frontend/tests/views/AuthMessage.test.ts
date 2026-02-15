import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AuthMessage from '@views/AuthMessage.vue';

describe('AuthMessage.vue', () => {
  it('renders nothing when no message', () => {
    const wrapper = mount(AuthMessage, {
      props: {
        message: {
          text: '',
          type: 'error',
        },
      },
    });

    expect(wrapper.find('div').exists()).toBe(false);
  });

  it('renders error message with error styling', () => {
    const wrapper = mount(AuthMessage, {
      props: {
        message: {
          text: 'Login failed',
          type: 'error',
        },
      },
    });

    expect(wrapper.text()).toBe('Login failed');
    expect(wrapper.html()).toContain('bg-red-50');
    expect(wrapper.html()).toContain('text-red-800');
    expect(wrapper.html()).toContain('border-red-200');
  });

  it('renders success message with success styling', () => {
    const wrapper = mount(AuthMessage, {
      props: {
        message: {
          text: 'Registration successful',
          type: 'success',
        },
      },
    });

    expect(wrapper.text()).toBe('Registration successful');
    expect(wrapper.html()).toContain('bg-green-50');
    expect(wrapper.html()).toContain('text-green-800');
    expect(wrapper.html()).toContain('border-green-200');
  });

  it('applies conditional classes for error type', () => {
    const wrapper = mount(AuthMessage, {
      props: {
        message: {
          text: 'Error message',
          type: 'error',
        },
      },
    });

    const messageDiv = wrapper.find('div');
    const classes = messageDiv.attributes('class');

    expect(classes).toContain('bg-red-50');
    expect(classes).not.toContain('bg-green-50');
  });

  it('applies conditional classes for success type', () => {
    const wrapper = mount(AuthMessage, {
      props: {
        message: {
          text: 'Success message',
          type: 'success',
        },
      },
    });

    const messageDiv = wrapper.find('div');
    const classes = messageDiv.attributes('class');

    expect(classes).toContain('bg-green-50');
    expect(classes).not.toContain('bg-red-50');
  });

  it('displays long error messages', () => {
    const longMessage = 'This is a very long error message that explains what went wrong in detail';

    const wrapper = mount(AuthMessage, {
      props: {
        message: {
          text: longMessage,
          type: 'error',
        },
      },
    });

    expect(wrapper.text()).toBe(longMessage);
  });

  it('displays special characters in message', () => {
    const specialMessage = "Invalid email: user@example.com's password";

    const wrapper = mount(AuthMessage, {
      props: {
        message: {
          text: specialMessage,
          type: 'error',
        },
      },
    });

    expect(wrapper.text()).toBe(specialMessage);
  });

  it('updates when props change', async () => {
    const wrapper = mount(AuthMessage, {
      props: {
        message: {
          text: 'Initial error',
          type: 'error',
        },
      },
    });

    expect(wrapper.text()).toBe('Initial error');

    await wrapper.setProps({
      message: {
        text: 'New success message',
        type: 'success',
      },
    });

    expect(wrapper.text()).toBe('New success message');
    expect(wrapper.html()).toContain('bg-green-50');
  });

  it('hides message when text becomes empty', async () => {
    const wrapper = mount(AuthMessage, {
      props: {
        message: {
          text: 'Error message',
          type: 'error',
        },
      },
    });

    expect(wrapper.find('div').exists()).toBe(true);

    await wrapper.setProps({
      message: {
        text: '',
        type: 'error',
      },
    });

    expect(wrapper.find('div').exists()).toBe(false);
  });

  it('has proper styling classes', () => {
    const wrapper = mount(AuthMessage, {
      props: {
        message: {
          text: 'Test message',
          type: 'error',
        },
      },
    });

    const messageDiv = wrapper.find('div');
    const classes = messageDiv.attributes('class');

    expect(classes).toContain('p-4');
    expect(classes).toContain('mb-4');
    expect(classes).toContain('text-sm');
    expect(classes).toContain('font-medium');
    expect(classes).toContain('rounded-lg');
  });
});
