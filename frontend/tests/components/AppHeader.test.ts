import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import AppHeader from '@components/AppHeader.vue';
import { authState } from '@/modules/auth';

describe('AppHeader.vue', () => {
  let router: any;

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/dashboard',
          name: 'dashboard',
          component: { template: '<div>Dashboard</div>' },
        },
        {
          path: '/reference-data',
          name: 'reference-data',
          component: { template: '<div>Reference Data</div>' },
        },
        {
          path: '/login',
          name: 'login',
          component: { template: '<div>Login</div>' },
        },
      ],
    });

    // Reset auth state
    authState.isAuthenticated = false;
    authState.token = null;
    authState.user = null;
  });

  it('renders header with logo', () => {
    const wrapper = mount(AppHeader, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.find('h1').text()).toBe('WealthTrack');
    expect(wrapper.find('.tagline').text()).toBe('Strategic wealth intelligence');
  });

  it('renders when not authenticated', () => {
    authState.isAuthenticated = false;
    authState.token = null;

    const wrapper = mount(AppHeader, {
      global: {
        plugins: [router],
      },
    });

    // Component should always render the header
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('h1').exists()).toBe(true);
  });
});
