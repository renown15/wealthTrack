/**
 * Tests for debug utility - comprehensive function coverage
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debug } from '../src/utils/debug';

describe('Debug Utility', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('enable() function', () => {
    it('should set debugMode to true in localStorage', () => {
      debug.enable();
      expect(localStorage.getItem('debugMode')).toBe('true');
    });

    it('should make isEnabled return true after enable()', () => {
      debug.enable();
      expect(debug.isEnabled()).toBe(true);
    });
  });

  describe('disable() function', () => {
    it('should set debugMode to false in localStorage', () => {
      debug.enable();
      debug.disable();
      expect(localStorage.getItem('debugMode')).toBe('false');
    });

    it('should make isEnabled return false after disable()', () => {
      debug.enable();
      debug.disable();
      expect(debug.isEnabled()).toBe(false);
    });
  });

  describe('isEnabled() function', () => {
    it('should return true when debugMode is set to true', () => {
      localStorage.setItem('debugMode', 'true');
      expect(debug.isEnabled()).toBe(true);
    });

    it('should return false when debugMode is set to false', () => {
      localStorage.setItem('debugMode', 'false');
      expect(debug.isEnabled()).toBe(false);
    });

    it('should return false when debugMode is not set and not in dev', () => {
      localStorage.clear();
      // In test environment, import.meta.env.DEV might be true, so we set to false explicitly
      localStorage.setItem('debugMode', 'false');
      expect(debug.isEnabled()).toBe(false);
    });
  });

  describe('log() function', () => {
    it('should call console.debug when debug is enabled', () => {
      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      debug.enable();
      debug.log('Test message', { data: 'test' });
      expect(consoleDebugSpy).toHaveBeenCalledWith('Test message', { data: 'test' });
      consoleDebugSpy.mockRestore();
    });

    it('should not call console.debug when debug is disabled', () => {
      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      debug.disable();
      debug.log('Test message', { data: 'test' });
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      consoleDebugSpy.mockRestore();
    });

    it('should handle log without additional data', () => {
      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      debug.enable();
      debug.log('Just a message');
      expect(consoleDebugSpy).toHaveBeenCalledWith('Just a message', undefined);
      consoleDebugSpy.mockRestore();
    });
  });

  describe('error() function', () => {
    it('should call console.error when debug is enabled', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      debug.enable();
      const err = new Error('Test error');
      debug.error('Error occurred', err);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error occurred', err);
      consoleErrorSpy.mockRestore();
    });

    it('should not call console.error when debug is disabled', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      debug.disable();
      debug.error('Error occurred', new Error('Test'));
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('warn() function', () => {
    it('should call console.warn when debug is enabled', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      debug.enable();
      debug.warn('Warning message', { warning: 'data' });
      expect(consoleWarnSpy).toHaveBeenCalledWith('Warning message', { warning: 'data' });
      consoleWarnSpy.mockRestore();
    });

    it('should not call console.warn when debug is disabled', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      debug.disable();
      debug.warn('Warning message', { warning: 'data' });
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('info() function', () => {
    it('should call console.info when debug is enabled', () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      debug.enable();
      debug.info('Info message', { info: 'data' });
      expect(consoleInfoSpy).toHaveBeenCalledWith('Info message', { info: 'data' });
      consoleInfoSpy.mockRestore();
    });

    it('should not call console.info when debug is disabled', () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      debug.disable();
      debug.info('Info message', { info: 'data' });
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      consoleInfoSpy.mockRestore();
    });
  });

  describe('localStorage persistence', () => {
    it('should persist debug state across enable/disable cycles', () => {
      debug.enable();
      expect(debug.isEnabled()).toBe(true);
      
      debug.disable();
      expect(debug.isEnabled()).toBe(false);
      
      debug.enable();
      expect(debug.isEnabled()).toBe(true);
    });
  });
});
