import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AuthTabs from '@views/AuthTabs.vue';

describe('AuthTabs.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders two tab buttons', () => {
    const wrapper = mount(AuthTabs, {
      props: {
        mode: 'login',
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBe(2);
  });

  it('renders Login and Register tabs', () => {
    const wrapper = mount(AuthTabs, {
      props: {
        mode: 'login',
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons[0].text()).toBe('Login');
    expect(buttons[1].text()).toBe('Register');
  });

  it('highlights login tab when in login mode', () => {
    const wrapper = mount(AuthTabs, {
      props: {
        mode: 'login',
      },
    });

    const loginButton = wrapper.findAll('button')[0];
    expect(loginButton.classes()).toContain('bg-white');
    expect(loginButton.classes()).toContain('text-blue-600');
    expect(loginButton.classes()).toContain('border-b-blue-600');
  });

  it('highlights register tab when in register mode', () => {
    const wrapper = mount(AuthTabs, {
      props: {
        mode: 'register',
      },
    });

    const registerButton = wrapper.findAll('button')[1];
    expect(registerButton.classes()).toContain('bg-white');
    expect(registerButton.classes()).toContain('text-blue-600');
    expect(registerButton.classes()).toContain('border-b-blue-600');
  });

  it('deselected tab has inactive styling in login mode', () => {
    const wrapper = mount(AuthTabs, {
      props: {
        mode: 'login',
      },
    });

    const registerButton = wrapper.findAll('button')[1];
    expect(registerButton.classes()).toContain('bg-gray-50');
    expect(registerButton.classes()).toContain('text-gray-600');
  });

  it('deselected tab has inactive styling in register mode', () => {
    const wrapper = mount(AuthTabs, {
      props: {
        mode: 'register',
      },
    });

    const loginButton = wrapper.findAll('button')[0];
    expect(loginButton.classes()).toContain('bg-gray-50');
    expect(loginButton.classes()).toContain('text-gray-600');
  });

  it('emits update:mode when login tab clicked', async () => {
    const wrapper = mount(AuthTabs, {
      props: {
        mode: 'register',
      },
    });

    const loginButton = wrapper.findAll('button')[0];
    await loginButton.trigger('click');

    expect(wrapper.emitted('update:mode')).toHaveLength(1);
    expect(wrapper.emitted('update:mode')?.[0]?.[0]).toBe('login');
  });

  it('emits update:mode when register tab clicked', async () => {
    const wrapper = mount(AuthTabs, {
      props: {
        mode: 'login',
      },
    });

    const registerButton = wrapper.findAll('button')[1];
    await registerButton.trigger('click');

    expect(wrapper.emitted('update:mode')).toHaveLength(1);
    expect(wrapper.emitted('update:mode')?.[0]?.[0]).toBe('register');
  });

  it('has proper button styling classes', () => {
    const wrapper = mount(AuthTabs, {
      props: {
        mode: 'login',
      },
    });

    const buttons = wrapper.findAll('button');
    for (const button of buttons) {
      const classes = button.attributes('class');
      expect(classes).toContain('flex-1');
      expect(classes).toContain('py-4');
      expect(classes).toContain('px-4');
      expect(classes).toContain('text-sm');
      expect(classes).toContain('font-semibold');
      expect(classes).toContain('border-none');
      expect(classes).toContain('cursor-pointer');
    }
  });

  it('has border-bottom styling', () => {
    const wrapper = mount(AuthTabs, {
      props: {
        mode: 'login',
      },
    });

    const container = wrapper.find('div');
    expect(container.classes()).toContain('flex');
    expect(container.classes()).toContain('border-b');
    expect(container.classes()).toContain('border-gray-200');
    expect(container.classes()).toContain('bg-gray-50');
  });

  it('emits correct mode when switching from login to register', async () => {
    const wrapper = mount(AuthTabs, {
      props: {
        mode: 'login',
      },
    });

    const registerButton = wrapper.findAll('button')[1];
    await registerButton.trigger('click');

    expect(wrapper.emitted('update:mode')?.[0]?.[0]).toBe('register');
  });

  it('emits correct mode when switching from register to login', async () => {
    const wrapper = mount(AuthTabs, {
      props: {
        mode: 'register',
      },
    });

    const loginButton = wrapper.findAll('button')[0];
    await loginButton.trigger('click');

    expect(wrapper.emitted('update:mode')?.[0]?.[0]).toBe('login');
  });

  it('applies border-b-blue-600 only to active tab in login mode', () => {
    const wrapper = mount(AuthTabs, {
      props: {
        mode: 'login',
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons[0].classes()).toContain('border-b-blue-600');
    expect(buttons[1].classes()).not.toContain('border-b-blue-600');
  });

  it('applies border-b-blue-600 only to active tab in register mode', () => {
    const wrapper = mount(AuthTabs, {
      props: {
        mode: 'register',
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons[1].classes()).toContain('border-b-blue-600');
    expect(buttons[0].classes()).not.toContain('border-b-blue-600');
  });

  it('responds to prop changes', async () => {
    const wrapper = mount(AuthTabs, {
      props: {
        mode: 'login',
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons[0].classes()).toContain('border-b-blue-600');

    await wrapper.setProps({ mode: 'register' });

    expect(buttons[1].classes()).toContain('border-b-blue-600');
  });

  it('has transition-all duration-200 on buttons', () => {
    const wrapper = mount(AuthTabs, {
      props: {
        mode: 'login',
      },
    });

    const buttons = wrapper.findAll('button');
    for (const button of buttons) {
      expect(button.classes()).toContain('transition-all');
      expect(button.classes()).toContain('duration-200');
    }
  });
});
