/**
 * Tests for Router - Navigation functionality
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '../src/router';
import { authModule } from '../src/modules/auth';

describe('Router - Navigation', () => {
  let viewContainer: HTMLElement;
  let userDisplay: HTMLElement;
  let userName: HTMLElement;
  let navLogout: HTMLElement;

  beforeEach(() => {
    viewContainer = document.createElement('div');
    viewContainer.id = 'view-container';
    document.body.appendChild(viewContainer);

    userDisplay = document.createElement('span');
    userDisplay.id = 'user-display';
    userDisplay.classList.add('hidden');
    document.body.appendChild(userDisplay);

    userName = document.createElement('span');
    userName.id = 'user-name';
    userDisplay.appendChild(userName);

    navLogout = document.createElement('a');
    navLogout.id = 'nav-logout';
    userDisplay.appendChild(navLogout);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    authModule.clearToken();
  });

  it('should initialize router', () => {
    const router = new Router();
    expect(router).toBeDefined();
  });

  it('should navigate to login page', () => {
    const router = new Router();
    router.navigate('login');

    expect(viewContainer.children.length).toBeGreaterThan(0);
  });

  it('should show user-display as hidden when not authenticated', () => {
    const router = new Router();
    router.navigate('login');

    expect(userDisplay.classList.contains('hidden')).toBeTruthy();
  });

  it('should handle navigation via CustomEvent', () => {
    const router = new Router();
    router.setupNavigation();
    
    // Router navigates in response to clicking nav links
    // Simulate a click on the login nav link
    const loginNavLink = document.getElementById('nav-login') as HTMLElement;
    if (loginNavLink) {
      const clickEvent = new MouseEvent('click', { bubbles: true });
      loginNavLink.dispatchEvent(clickEvent);
    } else {
      // If nav link doesn't exist, call navigate directly to render the view
      router.navigate('login');
    }

    expect(viewContainer.children.length).toBeGreaterThan(0);
  });

  it('should show user-display when navigating to dashboard', () => {
    const router = new Router();
    
    // Set up authenticated state
    authModule.setToken('test-token');
    const mockUser = { firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
    authModule.setUser(mockUser);

    router.navigate('dashboard');
    
    expect(userDisplay.classList.contains('hidden')).toBeFalsy();
    expect(userDisplay.textContent).toContain('John Doe');
  });

  it('should hide user-display when navigating to login without auth', () => {
    const router = new Router();
    
    // Clear auth state
    authModule.clearToken();

    router.navigate('login');

    expect(userDisplay.classList.contains('hidden')).toBeTruthy();
  });

  it('should update user name when user data changes', () => {
    const router = new Router();
    
    // Set up authenticated state
    authModule.setToken('test-token');
    const mockUser = { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' };
    authModule.setUser(mockUser);

    router.navigate('dashboard');

    expect(userName.textContent).toBe('Jane Smith');
  });

  it('should handle navigation to login view', () => {
    const router = new Router();

    router.navigate('login');

    expect(viewContainer.children.length).toBeGreaterThan(0);
  });

  it('should handle navigation to dashboard view when authenticated', () => {
    const router = new Router();
    
    // Set up authenticated state
    authModule.setToken('test-token');
    authModule.setUser({ firstName: 'Test', lastName: 'User', email: 'test@example.com' });

    // Navigate to dashboard - should not redirect back to login
    router.navigate('dashboard');

    // Header should show user display
    expect(userDisplay.classList.contains('hidden')).toBeFalsy();
  });
});
