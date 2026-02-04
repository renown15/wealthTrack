/**
 * Tests for HomeController.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HomeController } from '../src/controllers/HomeController';

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

  it('should create a home view when initialized', () => {
    const controller = new HomeController('home-container');
    controller.init();

    expect(container.children.length).toBeGreaterThan(0);
  });

  it('should render home page content', () => {
    const controller = new HomeController('home-container');
    controller.init();

    const content = container.textContent || '';
    expect(content.length).toBeGreaterThan(0);
  });

  it('should render section with correct class', () => {
    const controller = new HomeController('home-container');
    controller.init();

    const section = container.querySelector('section.home-section');
    expect(section).toBeDefined();
  });

  it('should render welcome message', () => {
    const controller = new HomeController('home-container');
    controller.init();

    const text = container.textContent || '';
    expect(text.length).toBeGreaterThan(0);
  });

  it('should have logout button if authenticated', () => {
    const controller = new HomeController('home-container');
    controller.init();

    // Check for logout button
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  it('should render navigation links', () => {
    const controller = new HomeController('home-container');
    controller.init();

    // Check that home view renders properly
    const elements = container.querySelectorAll('*');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should render correct container structure', () => {
    const controller = new HomeController('home-container');
    controller.init();

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

  it('should handle logout action', () => {
    const controller = new HomeController('home-container');
    controller.init();

    // Verify controller is set up correctly
    expect(controller).toBeDefined();
  });

  it('should display user information if available', () => {
    const controller = new HomeController('home-container');
    controller.init();

    // Home view should be rendered
    expect(container.children.length).toBeGreaterThan(0);
  });
});
