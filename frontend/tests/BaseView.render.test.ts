/**
 * Tests for BaseView - Rendering and initialization
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BaseView } from '../src/views/BaseView';

class TestView extends BaseView {
  render(): void {
    this.clear();
    const div = document.createElement('div');
    div.textContent = 'Test View';
    this.container.appendChild(div);
  }
}

describe('BaseView - Rendering', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('should initialize with container', () => {
    const view = new TestView('test-container');
    expect(view).toBeDefined();
  });

  it('should throw error if container not found', () => {
    expect(() => new TestView('nonexistent')).toThrow('Container with id');
  });

  it('should render content', () => {
    const view = new TestView('test-container');
    view.render();
    expect(container.textContent).toContain('Test View');
  });

  it('should clear container', () => {
    const view = new TestView('test-container');

    container.innerHTML = '<p>Old content</p>';
    expect(container.innerHTML).toContain('Old content');

    view['clear']();
    expect(container.innerHTML).toBe('');
  });

  it('should render view after initialization', () => {
    const view = new TestView('test-container');
    view.render();

    expect(container.children.length).toBeGreaterThan(0);
  });

  it('should maintain container reference', () => {
    const view = new TestView('test-container');
    view.render();

    expect(container.innerHTML).toContain('Test View');
  });
});
