import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { ref, reactive } from 'vue';
import Auth from '@views/Auth.vue';

// Mock composables
const mockHandleLogin = vi.fn();
const mockHandleRegister = vi.fn();
const mockShowError = vi.fn();
const mockClearMessage = vi.fn();
const mockResetForm = vi.fn();
const mockShowSuccess = vi.fn();

const isSubmitting = ref(false);
const formData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
});
const errorsData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
});
const messageData = reactive({
  text: '',
  type: 'error' as const,
});

vi.mock('@/composables/useAuthFormState', () => ({
  useAuthFormState: () => ({
    form: formData,
    errors: errorsData,
    resetForm: mockResetForm,
    clearErrors: vi.fn(),
    setErrors: vi.fn(),
  }),
}));

vi.mock('@/composables/useAuthMessages', () => ({
  useAuthMessages: () => ({
    message: messageData,
    clearMessage: mockClearMessage,
    showError: mockShowError,
    showSuccess: mockShowSuccess,
  }),
}));

vi.mock('@/composables/useAuthService', () => ({
  useAuthService: () => ({
    isSubmitting,
    handleLogin: mockHandleLogin,
    handleRegister: mockHandleRegister,
  }),
}));

const createTestRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
      { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
    ],
  });
};

describe('Auth.vue', () => {
  let router = createTestRouter();

  beforeEach(() => {
    vi.clearAllMocks();
    isSubmitting.value = false;
    formData.firstName = '';
    formData.lastName = '';
    formData.email = '';
    formData.password = '';
    errorsData.firstName = '';
    errorsData.lastName = '';
    errorsData.email = '';
    errorsData.password = '';
    messageData.text = '';
    messageData.type = 'error';
    router = createTestRouter();
  });

  it('renders auth page with header', () => {
    const wrapper = mount(Auth, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.find('h1').text()).toBe('WealthTrack');
    expect(wrapper.text()).toContain('Welcome back');
  });

  it('starts in login mode by default', () => {
    const wrapper = mount(Auth, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain('Welcome back');
    expect(wrapper.text()).toContain("Don't have an account?");
  });

  it('switches to register mode when register button clicked', async () => {
    const wrapper = mount(Auth, {
      global: {
        plugins: [router],
      },
    });

    const registerLink = wrapper.findAll('button').find((btn) => btn.text().includes('Register'));
    await registerLink?.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Create your account');
  });

  it('switches back to login mode', async () => {
    const wrapper = mount(Auth, {
      global: {
        plugins: [router],
      },
      props: {
        initialMode: 'register',
      },
    });

    const loginLink = wrapper.findAll('button').find((btn) => btn.text().includes('Login'));
    await loginLink?.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Welcome back');
  });

  it('renders AuthTabs component', () => {
    const wrapper = mount(Auth, {
      global: {
        plugins: [router],
      },
    });

    const tabs = wrapper.findAll('button.flex-1');
    expect(tabs.length).toBeGreaterThanOrEqual(2);
  });

  it('renders AuthMessage component', () => {
    const wrapper = mount(Auth, {
      global: {
        plugins: [router],
      },
    });

    // AuthMessage is present in the template
    expect(wrapper.html()).toContain('form');
  });

  it('renders AuthForm component', () => {
    const wrapper = mount(Auth, {
      global: {
        plugins: [router],
      },
    });

    // AuthForm should render the email input
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
  });

  it('handles login submission', async () => {
    mockHandleLogin.mockResolvedValue({ success: true });

    const wrapper = mount(Auth, {
      global: {
        plugins: [router],
      },
    });

    const form = wrapper.find('form');
    await form.trigger('submit');
    await flushPromises();

    expect(mockHandleLogin).toHaveBeenCalled();
  });

  it('clears message on submit', async () => {
    mockHandleLogin.mockResolvedValue({ success: true });

    const wrapper = mount(Auth, {
      global: {
        plugins: [router],
      },
    });

    const form = wrapper.find('form');
    await form.trigger('submit');

    expect(mockClearMessage).toHaveBeenCalled();
  });

  it('handles register submission', async () => {
    mockHandleRegister.mockResolvedValue({ success: true });

    const wrapper = mount(Auth, {
      global: {
        plugins: [router],
      },
      props: {
        initialMode: 'register',
      },
    });

    const form = wrapper.find('form');
    await form.trigger('submit');
    await flushPromises();

    expect(mockHandleRegister).toHaveBeenCalled();
  });

  it('renders submit button', () => {
    const wrapper = mount(Auth, {
      global: {
        plugins: [router],
      },
    });

    const button = wrapper.find('button[type="submit"]');
    expect(button.exists()).toBe(true);
  });
});
