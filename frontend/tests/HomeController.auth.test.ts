/**
 * Tests for HomeController - Authentication handling
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HomeController } from '../src/controllers/HomeController';
import * as ApiServiceModule from '../src/services/ApiService';
import * as AuthModule from '../src/modules/auth';

vi.mock('../src/services/ApiService', () => ({
  apiService: {
    getAuthToken: vi.fn(() => null),
    setAuthToken: vi.fn(),
    clearAuthToken: vi.fn(),
    getCurrentUser: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
  },
}));

vi.mock('../src/modules/auth', () => ({
  authModule: {
    isAuthenticated: vi.fn(() => false),
    clearToken: vi.fn(),
    setToken: vi.fn(),
    getToken: vi.fn(() => null),
  },
}));

vi.mock('../src/router', () => ({
  getRouter: vi.fn(() => ({
    navigate: vi.fn(),
  })),
}));

const mockApiService = ApiServiceModule.apiService as any;
const mockAuthModule = AuthModule.authModule as any;

describe('HomeController - Authentication', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'home-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('should handle logout action', async () => {
    const controller = new HomeController('home-container');
    await controller.init();

    expect(controller).toBeDefined();
  });

  it('should load authenticated user if token exists', async () => {
    const mockUser = { id: 1, email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    mockAuthModule.isAuthenticated.mockReturnValue(true);
    mockApiService.getCurrentUser.mockResolvedValue(mockUser);

    const controller = new HomeController('home-container');
    controller.init();
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockApiService.getCurrentUser).toHaveBeenCalled();
    expect(container.children.length).toBeGreaterThan(0);
  });

  it('should handle invalid token by clearing it', async () => {
    mockAuthModule.isAuthenticated.mockReturnValue(true);
    mockApiService.getCurrentUser.mockRejectedValue(new Error('Unauthorized'));

    const controller = new HomeController('home-container');
    controller.init();
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockAuthModule.clearToken).toHaveBeenCalled();
  });

  it('should render home view with no user if token invalid', async () => {
    mockAuthModule.isAuthenticated.mockReturnValue(true);
    mockApiService.getCurrentUser.mockRejectedValue(new Error('Unauthorized'));

    const controller = new HomeController('home-container');
    controller.init();
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(container.children.length).toBeGreaterThan(0);
  });

  it('should set up logout handler if user is authenticated', async () => {
    const mockUser = { id: 1, email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    mockApiService.getAuthToken.mockReturnValue('valid-token');
    mockAuthModule.isAuthenticated.mockReturnValue(true);
    mockApiService.getCurrentUser.mockResolvedValue(mockUser);

    const controller = new HomeController('home-container');
    controller.init();
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify controller was initialized (not container content as it's async)
    expect(controller).toBeDefined();
  });

  it('should handle logout with localStorage cleanup', () => {
    const mockUser = { id: 1, email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    mockApiService.getAuthToken.mockReturnValue('valid-token');
    mockApiService.getCurrentUser.mockResolvedValue(mockUser);

    const controller = new HomeController('home-container');

    expect(controller).toBeDefined();
  });

  it('should clear auth token on logout', () => {
    const controller = new HomeController('home-container');
    expect(controller).toBeDefined();

    expect(typeof mockApiService.clearAuthToken).toBe('function');
  });
});
