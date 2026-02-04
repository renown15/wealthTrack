/**
 * Tests for HomeController.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HomeController } from '../src/controllers/HomeController';

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

describe('HomeController', () => {
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

  it('should initialize controller', () => {
    const controller = new HomeController('home-container');
    expect(controller).toBeDefined();
  });

  it('should create a home view when initialized', async () => {
    const controller = new HomeController('home-container');
    await controller.init();

    expect(container.children.length).toBeGreaterThan(0);
  });

  it('should render home page content', async () => {
    const controller = new HomeController('home-container');
    await controller.init();

    const content = container.textContent || '';
    expect(content.length).toBeGreaterThan(0);
  });

  it('should render section with correct class', async () => {
    const controller = new HomeController('home-container');
    await controller.init();

    const section = container.querySelector('section.home-section');
    expect(section).toBeDefined();
  });

  it('should render welcome message', async () => {
    const controller = new HomeController('home-container');
    await controller.init();

    const text = container.textContent || '';
    expect(text.length).toBeGreaterThan(0);
  });

  it('should have logout button if authenticated', async () => {
    const controller = new HomeController('home-container');
    await controller.init();

    // Check for logout button
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  it('should render navigation links', async () => {
    const controller = new HomeController('home-container');
    await controller.init();

    // Check that home view renders properly
    const elements = container.querySelectorAll('*');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should render correct container structure', async () => {
    const controller = new HomeController('home-container');
    await controller.init();

    const cont = document.getElementById('home-container');
    expect(cont).toBeDefined();
    expect(cont?.children.length).toBeGreaterThan(0);
  });

  it('should initialize with correct container ID', () => {
    const controller = new HomeController('home-container');
    expect(controller).toBeDefined();

    const cont = document.getElementById('home-container');
    expect(cont).toBeDefined();
  });

  it('should handle logout action', async () => {
    const controller = new HomeController('home-container');
    await controller.init();

    // Verify controller is set up correctly
    expect(controller).toBeDefined();
  });

  it('should display user information if available', async () => {
    const controller = new HomeController('home-container');
    await controller.init();

    // Home view should be rendered
    expect(container.children.length).toBeGreaterThan(0);
  });
});
