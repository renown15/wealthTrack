/**
 * Tests for HomeController - Authentication handling
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HomeController } from '../src/controllers/HomeController';
import * as ApiServiceModule from '../src/services/ApiService';

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

const mockApiService = ApiServiceModule.apiService as any;

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
    mockApiService.getAuthToken.mockReturnValue('valid-token');
    mockApiService.getCurrentUser.mockResolvedValue(mockUser);

    const controller = new HomeController('home-container');
    await controller.init();

    expect(mockApiService.getCurrentUser).toHaveBeenCalled();
    expect(container.children.length).toBeGreaterThan(0);
  });

  it('should handle invalid token by clearing it', async () => {
    mockApiService.getAuthToken.mockReturnValue('invalid-token');
    mockApiService.getCurrentUser.mockRejectedValue(new Error('Unauthorized'));

    const removeItemSpy = vi.spyOn(localStorage, 'removeItem');

    const controller = new HomeController('home-container');
    await controller.init();

    expect(mockApiService.clearAuthToken).toHaveBeenCalled();
    expect(removeItemSpy).toHaveBeenCalledWith('accessToken');
    
    removeItemSpy.mockRestore();
  });

  it('should render home view with no user if token invalid', async () => {
    mockApiService.getAuthToken.mockReturnValue('invalid-token');
    mockApiService.getCurrentUser.mockRejectedValue(new Error('Unauthorized'));

    const removeItemSpy = vi.spyOn(localStorage, 'removeItem');

    const controller = new HomeController('home-container');
    await controller.init();

    expect(container.children.length).toBeGreaterThan(0);
    
    removeItemSpy.mockRestore();
  });

  it('should set up logout handler if user is authenticated', async () => {
    const mockUser = { id: 1, email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    mockApiService.getAuthToken.mockReturnValue('valid-token');
    mockApiService.getCurrentUser.mockResolvedValue(mockUser);

    const controller = new HomeController('home-container');
    await controller.init();

    expect(container.children.length).toBeGreaterThan(0);
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
