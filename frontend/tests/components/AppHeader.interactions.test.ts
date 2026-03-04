import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reactive, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import AppHeader from '@components/AppHeader.vue';
import { authState, authModule } from '@/modules/auth';

// Mock auth module with factory function that doesn't reference outer scope
vi.mock('@/modules/auth', () => ({
  authState: reactive({
    isAuthenticated: false,
    token: null as string | null,
    user: null as any,
  }),
  authModule: { 
    clearToken: vi.fn(),
  },
}));

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/dashboard', name: 'dashboard', component: { template: '<div />' } },
      { path: '/analytics', name: 'analytics', component: { template: '<div />' } },
      { path: '/reference-data', name: 'reference-data', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } },
    ],
  });
}

describe('AppHeader authenticated state', () => {
  let router: ReturnType<typeof makeRouter>;

  beforeEach(() => {
    vi.clearAllMocks();
    router = makeRouter();
    authState.isAuthenticated = false;
    authState.token = null;
    authState.user = null;
  });

  it('renders nav when authenticated', async () => {
    authState.isAuthenticated = true;
    authState.token = 'token123';
    const wrapper = mount(AppHeader, { global: { plugins: [router] } });
    await nextTick();
    expect(wrapper.find('nav').exists()).toBe(true);
  });

  it('shows user name when authenticated with user', async () => {
    authState.isAuthenticated = true;
    authState.token = 'token123';
    authState.user = { firstName: 'Alice', lastName: 'Smith' };
    const wrapper = mount(AppHeader, { global: { plugins: [router] } });
    await nextTick();
    expect(wrapper.text()).toContain('Alice Smith');
  });

  it('isRoute: active class applied for current route', async () => {
    authState.isAuthenticated = true;
    authState.token = 'token123';
    await router.push('/dashboard');
    await router.isReady();
    const wrapper = mount(AppHeader, { global: { plugins: [router] } });
    await nextTick();
    const links = wrapper.findAll('a.nav-btn');
    const dashboardLink = links.find(a => a.text().includes('Account Hub'));
    expect(dashboardLink).toBeDefined();
    expect(dashboardLink?.classes()).toContain('active');
  });

  it('logout: clicking logout button calls clearToken', async () => {
    authState.isAuthenticated = true;
    authState.token = 'token123';
    const wrapper = mount(AppHeader, { global: { plugins: [router] } });
    await nextTick();
    const logoutBtn = wrapper.findAll('button').find(b => b.text().includes('Logout'));
    await logoutBtn!.trigger('click');
    expect(authModule.clearToken).toHaveBeenCalled();
  });

  it('does not render nav when not authenticated', () => {
    const wrapper = mount(AppHeader, { global: { plugins: [router] } });
    expect(wrapper.find('nav').exists()).toBe(false);
  });
});
