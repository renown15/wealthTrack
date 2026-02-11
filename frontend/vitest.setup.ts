/**
 * Vitest setup file - configure global test environment
 */
import { vi, afterAll } from 'vitest';

// Mock localStorage for all tests
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

// Ensure happy-dom's defaultView has proper error dispatch capability
if (window && (window as any).document && (window as any).document.defaultView) {
  const defaultView = (window as any).document.defaultView;
  if (defaultView && !defaultView.dispatchEvent) {
    defaultView.dispatchEvent = () => {};
  }
}

// Mock global fetch to prevent real HTTP requests in tests
global.fetch = vi.fn((url: string) => {
  console.warn(`Unmocked fetch call to: ${url}. Please mock this call in your test.`);
  return Promise.reject(new Error(`Fetch not mocked for ${url}`));
});

// Clean up any pending timers/promises after all tests
afterAll(async () => {
  // Wait a bit for any pending async operations to complete
  await new Promise(resolve => setTimeout(resolve, 100));
});
