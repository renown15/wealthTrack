import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAuthMessages } from '@/composables/useAuthMessages';

describe('useAuthMessages', () => {
  let messages: any;

  beforeEach(() => {
    vi.useFakeTimers();
    messages = useAuthMessages();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('message initialization', () => {
    it('initializes with empty message and error type', () => {
      expect(messages.message.text).toBe('');
      expect(messages.message.type).toBe('error');
    });
  });

  describe('showError', () => {
    it('displays error message with correct type', () => {
      messages.showError('Email is invalid', 0);
      expect(messages.message.text).toBe('Email is invalid');
      expect(messages.message.type).toBe('error');
    });

    it('auto-clears error message after timeout', () => {
      messages.showError('Error message');
      expect(messages.message.text).toBe('Error message');

      vi.advanceTimersByTime(5000);
      expect(messages.message.text).toBe('');
    });

    it('respects custom timeout duration', () => {
      messages.showError('Custom timeout', 3000);
      expect(messages.message.text).toBe('Custom timeout');

      vi.advanceTimersByTime(2999);
      expect(messages.message.text).toBe('Custom timeout');

      vi.advanceTimersByTime(1);
      expect(messages.message.text).toBe('');
    });

    it('respects zero timeout (no auto-clear)', () => {
      messages.showError('Persistent error', 0);
      expect(messages.message.text).toBe('Persistent error');

      vi.advanceTimersByTime(10000);
      expect(messages.message.text).toBe('Persistent error');
    });
  });

  describe('showSuccess', () => {
    it('displays success message with correct type', () => {
      messages.showSuccess('Registration successful!', 0);
      expect(messages.message.text).toBe('Registration successful!');
      expect(messages.message.type).toBe('success');
    });

    it('auto-clears success message after timeout', () => {
      messages.showSuccess('Success!');
      expect(messages.message.text).toBe('Success!');

      vi.advanceTimersByTime(5000);
      expect(messages.message.text).toBe('');
    });

    it('respects custom timeout for success', () => {
      messages.showSuccess('Success!', 2000);

      vi.advanceTimersByTime(1999);
      expect(messages.message.text).toBe('Success!');

      vi.advanceTimersByTime(1);
      expect(messages.message.text).toBe('');
    });
  });

  describe('clearMessage', () => {
    it('clears the message immediately', () => {
      messages.showError('Error', 0);
      expect(messages.message.text).toBe('Error');

      messages.clearMessage();
      expect(messages.message.text).toBe('');
    });

    it('prevents auto-clear from happening after manual clear', () => {
      messages.showError('Error');
      messages.clearMessage();

      vi.advanceTimersByTime(5000);
      expect(messages.message.text).toBe('');
    });
  });

  describe('message transitions', () => {
    it('switches from error to success', () => {
      messages.showError('Login failed', 0);
      expect(messages.message.type).toBe('error');

      messages.showSuccess('Now signed in!', 0);
      expect(messages.message.type).toBe('success');
      expect(messages.message.text).toBe('Now signed in!');
    });

    it('switches from success to error', () => {
      messages.showSuccess('Success!', 0);
      expect(messages.message.type).toBe('success');

      messages.showError('Then error', 0);
      expect(messages.message.type).toBe('error');
      expect(messages.message.text).toBe('Then error');
    });
  });

  describe('multiple messages', () => {
    it('replaces previous message when calling showError twice', () => {
      messages.showError('First error', 0);
      expect(messages.message.text).toBe('First error');

      messages.showError('Second error', 0);
      expect(messages.message.text).toBe('Second error');
    });

    it('cancels previous auto-clear when showing new message', () => {
      messages.showError('First', 5000);
      vi.advanceTimersByTime(3000);
      expect(messages.message.text).toBe('First');

      messages.showSuccess('Second', 5000);
      vi.advanceTimersByTime(2500);
      expect(messages.message.text).toBe('Second');

      // Original timeout for 'First' would have cleared at 5000, but it was cancelled
      // New timeout for 'Second' clears at 3000 (advance point) + 5000 = 8000 total
      vi.advanceTimersByTime(2500); // Now at 8000 total
      expect(messages.message.text).toBe('');
    });
  });
});
