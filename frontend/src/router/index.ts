/**
 * Vue Router configuration with hash mode.
 */
import { createRouter, createWebHashHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { authModule } from '@/modules/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@views/Auth.vue'),
    props: { initialMode: 'login' },
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@views/Auth.vue'),
    props: { initialMode: 'register' },
    meta: { requiresAuth: false },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@views/AccountHub/AccountHub.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/reference-data',
    name: 'reference-data',
    component: () => import('@views/ReferenceDataAdmin.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// Navigation guard for authentication
router.beforeEach((to, _from, next) => {
  const requiresAuth = to.meta.requiresAuth as boolean;
  const isAuthenticated = authModule.isAuthenticated();

  if (requiresAuth && !isAuthenticated) {
    // Redirect to login if trying to access protected route
    next({ name: 'login' });
  } else if (!requiresAuth && isAuthenticated && (to.name === 'login' || to.name === 'register')) {
    // Redirect to dashboard if already logged in
    next({ name: 'dashboard' });
  } else {
    next();
  }
});

export default router;
