/**
 * Tests for HomeView.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HomeView } from '../src/views/HomeView';

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
});
