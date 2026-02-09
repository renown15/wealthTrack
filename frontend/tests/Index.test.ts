/**
 * Tests for main application entry point.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Router before importing index
const mockNavigate = vi.fn().mockResolvedValue(undefined);
const mockSetupNavigation = vi.fn();
const mockRouter = {
  navigate: mockNavigate,
  setupNavigation: mockSetupNavigation,
};

vi.mock('../src/router', () => ({
  Router: class MockRouter {
    navigate = mockNavigate;
    setupNavigation = mockSetupNavigation;
  },
  getRouter: () => mockRouter,
}));

// Mock ApiService
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

describe('Application Index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should export initializeApp function', async () => {
    const module = await import('../src/index');
    expect(typeof module.initializeApp).toBe('function');
  });

  it('should initialize router and navigate to home', async () => {
    const { initializeApp } = await import('../src/index');
    mockNavigate.mockClear();

    await initializeApp();

    expect(mockNavigate).toHaveBeenCalledWith('home');
  });

  it('should create Router instance', async () => {
    const { Router } = await import('../src/router');
    const router = new Router();
    expect(router).toBeDefined();
    expect(typeof router.navigate).toBe('function');
  });

  it('should handle async navigation operation', async () => {
    const { initializeApp } = await import('../src/index');
    mockNavigate.mockResolvedValue(undefined);
    mockNavigate.mockClear();

    await initializeApp();

    expect(mockNavigate).toHaveBeenCalled();
  });

  it('should return undefined from navigation call', async () => {
    const { initializeApp } = await import('../src/index');
    mockNavigate.mockResolvedValue(undefined);

    const result = await initializeApp();
    expect(result).toBeUndefined();
  });

  it('should call navigate exactly once per initialization', async () => {
    const { initializeApp } = await import('../src/index');
    mockNavigate.mockClear();

    await initializeApp();

    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('should import Router module successfully', async () => {
    const { Router } = await import('../src/router');
    expect(Router).toBeDefined();
  });

  it('should handle Router navigate with home parameter', async () => {
    const { initializeApp } = await import('../src/index');
    mockNavigate.mockClear();

    await initializeApp();

    expect(mockNavigate).toHaveBeenCalledWith('home');
    expect(mockNavigate).not.toHaveBeenCalledWith('login');
    expect(mockNavigate).not.toHaveBeenCalledWith('register');
  });
});

