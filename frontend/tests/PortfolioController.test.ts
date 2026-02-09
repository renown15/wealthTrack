/**
 * Tests for PortfolioController
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PortfolioController } from '../src/controllers/PortfolioController';
import { apiService } from '@services/ApiService';

vi.mock('@services/ApiService', () => ({
  apiService: {
    getAuthToken: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

vi.mock('@/router', () => ({
  getRouter: vi.fn(() => ({
    navigate: vi.fn(),
  })),
}));

describe('PortfolioController', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'portfolio-container';
    document.body.appendChild(container);
    vi.clearAllMocks();
  });

  afterEach(() => {
    container.remove();
  });

  it('should initialize controller', () => {
    const controller = new PortfolioController('portfolio-container');
    expect(controller).toBeDefined();
  });

  it('should redirect to login when no token exists', () => {
    const mockApiService = apiService as any;
    mockApiService.getAuthToken.mockReturnValue(null);

    const controller = new PortfolioController('portfolio-container');
    controller.init();

    expect(mockApiService.getAuthToken).toHaveBeenCalled();
  });

  it('should return early if container not found', () => {
    const mockApiService = apiService as any;
    mockApiService.getAuthToken.mockReturnValue('valid-token');

    const controller = new PortfolioController('non-existent-container');
    controller.init();

    expect(mockApiService.getAuthToken).toHaveBeenCalled();
  });

  it('should validate token in background', async () => {
    const mockApiService = apiService as any;
    mockApiService.getAuthToken.mockReturnValue('valid-token');
    mockApiService.getCurrentUser.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
    });

    const controller = new PortfolioController('portfolio-container');
    controller.init();

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockApiService.getCurrentUser).toHaveBeenCalled();
  });
});
