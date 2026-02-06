/**
 * Debug logging utility with environment and localStorage control.
 * 
 * Usage:
 *   debug.log('[Category] Message', data)
 *   debug.error('[Category] Error', error)
 * 
 * Control via:
 *   - Environment: DEV mode enables debug by default
 *   - localStorage: Set `debugMode=true` or `debugMode=false` in browser console
 *   - Toggle: `localStorage.setItem('debugMode', 'true')` in browser console
 */

function isDebugEnabled(): boolean {
  // Check localStorage override first
  const storageValue = localStorage.getItem('debugMode');
  if (storageValue !== null) {
    return storageValue === 'true';
  }

  // Default: enable in dev mode, disable in production
  return import.meta.env.DEV;
}

interface DebugInterface {
  log: (message: string, data?: unknown) => void;
  error: (message: string, error?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  enable: () => void;
  disable: () => void;
  isEnabled: () => boolean;
}

export const debug: DebugInterface = {
  log: (message: string, data?: unknown): void => {
    if (isDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.debug(message, data);
    }
  },

  error: (message: string, error?: unknown): void => {
    if (isDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.error(message, error);
    }
  },

  warn: (message: string, data?: unknown): void => {
    if (isDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.warn(message, data);
    }
  },

  info: (message: string, data?: unknown): void => {
    if (isDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.info(message, data);
    }
  },

  /**
   * Enable debug mode (persists to localStorage)
   */
  enable: (): void => {
    localStorage.setItem('debugMode', 'true');
    // eslint-disable-next-line no-console
    console.log('Debug mode enabled');
  },

  /**
   * Disable debug mode (persists to localStorage)
   */
  disable: (): void => {
    localStorage.setItem('debugMode', 'false');
    // eslint-disable-next-line no-console
    console.log('Debug mode disabled');
  },

  /**
   * Check current debug status
   */
  isEnabled: (): boolean => isDebugEnabled(),
};
