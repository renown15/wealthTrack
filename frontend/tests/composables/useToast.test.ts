/**
 * Tests for useToast composable.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  dismiss: vi.fn(),
  clear: vi.fn(),
};

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast,
  POSITION: { TOP_RIGHT: 'top-right' },
}));

import { useToast } from '@composables/useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('showSuccess calls toast.success', () => {
    const { showSuccess } = useToast();
    showSuccess('Done!');
    expect(mockToast.success).toHaveBeenCalledWith('Done!');
  });

  it('showError calls toast.error', () => {
    const { showError } = useToast();
    showError('Oops');
    expect(mockToast.error).toHaveBeenCalledWith('Oops');
  });

  it('showWarning calls toast.warning', () => {
    const { showWarning } = useToast();
    showWarning('Watch out');
    expect(mockToast.warning).toHaveBeenCalledWith('Watch out');
  });

  it('showInfo calls toast.info', () => {
    const { showInfo } = useToast();
    showInfo('FYI');
    expect(mockToast.info).toHaveBeenCalledWith('FYI');
  });

  it('dismiss with id calls toast.dismiss with id', () => {
    const { dismiss } = useToast();
    dismiss('toast-1');
    expect(mockToast.dismiss).toHaveBeenCalledWith('toast-1');
  });

  it('dismiss without id calls toast.clear', () => {
    const { dismiss } = useToast();
    dismiss();
    expect(mockToast.clear).toHaveBeenCalled();
  });
});
