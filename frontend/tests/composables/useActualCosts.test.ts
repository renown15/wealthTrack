import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useActualCosts } from '@composables/useActualCosts';
import { apiService } from '@services/ApiService';

vi.mock('@services/ApiService', () => ({
  apiService: {
    listActualCosts: vi.fn(),
    recordActualCost: vi.fn(),
    deleteActualCost: vi.fn(),
  },
}));

const mockActuals = [
  { groupId: 5, accountId: 10, amount: '142.50', costDate: '2026-06-01' },
  { groupId: 6, accountId: 10, amount: '130.00', costDate: '2026-05-01' },
];

describe('useActualCosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiService.listActualCosts).mockResolvedValue(mockActuals);
    vi.mocked(apiService.recordActualCost).mockResolvedValue(mockActuals[0]);
    vi.mocked(apiService.deleteActualCost).mockResolvedValue(undefined);
  });

  it('loads actuals for an account', async () => {
    const { actuals, loading, loadActuals } = useActualCosts();
    await loadActuals(10);
    expect(actuals.value).toStrictEqual(mockActuals);
    expect(loading.value).toBe(false);
    expect(apiService.listActualCosts).toHaveBeenCalledWith(10);
  });

  it('sets error when loading fails', async () => {
    vi.mocked(apiService.listActualCosts).mockRejectedValue(new Error('boom'));
    const { error, loadActuals } = useActualCosts();
    await loadActuals(10);
    expect(error.value).toBe('boom');
  });

  it('adds an actual and reloads', async () => {
    const { addActual } = useActualCosts();
    const ok = await addActual(10, '142.50', '2026-06-01');
    expect(ok).toBe(true);
    expect(apiService.recordActualCost).toHaveBeenCalledWith(10, {
      amount: '142.50', cost_date: '2026-06-01',
    });
    expect(apiService.listActualCosts).toHaveBeenCalledWith(10);
  });

  it('returns false and sets error when add fails', async () => {
    vi.mocked(apiService.recordActualCost).mockRejectedValue(new Error('nope'));
    const { error, addActual } = useActualCosts();
    const ok = await addActual(10, '1', '2026-01-01');
    expect(ok).toBe(false);
    expect(error.value).toBe('nope');
  });

  it('removes an actual from local state on delete', async () => {
    const { actuals, loadActuals, removeActual } = useActualCosts();
    await loadActuals(10);
    const ok = await removeActual(5);
    expect(ok).toBe(true);
    expect(actuals.value.map((a) => a.groupId)).toStrictEqual([6]);
    expect(apiService.deleteActualCost).toHaveBeenCalledWith(5);
  });

  it('returns false and keeps state when delete fails', async () => {
    vi.mocked(apiService.deleteActualCost).mockRejectedValue(new Error('nope'));
    const { actuals, loadActuals, removeActual } = useActualCosts();
    await loadActuals(10);
    const ok = await removeActual(5);
    expect(ok).toBe(false);
    expect(actuals.value).toHaveLength(2);
  });
});
