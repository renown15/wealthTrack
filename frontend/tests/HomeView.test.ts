/**
 * Tests for HomeView.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HomeView } from '../src/views/HomeView';
import type { User } from '../src/models/User';

describe('HomeView', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should initialize HomeView', () => {
    const view = new HomeView('test-container');
    expect(view).toBeDefined();
  });

  it('should render home page content', () => {
    const view = new HomeView('test-container');
    view.render();

    expect(container.children.length).toBeGreaterThan(0);
  });

  it('should display page content', () => {
    const view = new HomeView('test-container');
    view.render();

    const content = container.textContent || '';
    expect(content.length).toBeGreaterThan(0);
  });

  it('should contain DOM elements after rendering', () => {
    const view = new HomeView('test-container');
    view.render();

    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('should render authenticated user view with user data', () => {
    const view = new HomeView('test-container');
    const mockUser: User = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      fullName: 'Test User',
      isActive: true,
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    view.render(mockUser);

    const content = container.textContent || '';
    expect(content).toContain('Welcome back');
    expect(content).toContain('Test User');
    expect(content).toContain('test@example.com');
    expect(content).toContain('Logout');
  });

  it('should handle logout callback when logout button clicked', () => {
    const view = new HomeView('test-container');
    const mockUser: User = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      fullName: 'Test User',
      isActive: true,
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const logoutCallback = vi.fn();
    view.onLogout(logoutCallback);
    view.render(mockUser);

    const logoutButton = container.querySelector('button');
    expect(logoutButton).toBeDefined();
    logoutButton?.click();
    expect(logoutCallback).toHaveBeenCalled();
  });
});
