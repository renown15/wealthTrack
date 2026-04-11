import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTaxPeriods } from '@composables/useTaxPeriods';
import { apiService } from '@services/ApiService';
import type { TaxPeriod } from '@models/TaxModels';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    listTaxPeriods: vi.fn(),
    createTaxPeriod: vi.fn(),
    deleteTaxPeriod: vi.fn(),
  },
}));

vi.mock('@composables/useToast', () => ({
  useToast: () => ({ showSuccess: vi.fn(), showError: vi.fn() }),
}));

const mockApi = vi.mocked(apiService);

const p1: TaxPeriod = {
  id: 1, userId: 1, name: '2024/25',
  startDate: '2024-04-06', endDate: '2025-04-05',
  createdAt: '2024-04-06T00:00:00', updatedAt: '2024-04-06T00:00:00',
};
const p2: TaxPeriod = {
  id: 2, userId: 1, name: '2023/24',
  startDate: '2023-04-06', endDate: '2024-04-05',
  createdAt: '2023-04-06T00:00:00', updatedAt: '2023-04-06T00:00:00',
};

describe('useTaxPeriods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.listTaxPeriods.mockResolvedValue([p1, p2]);
    mockApi.createTaxPeriod.mockResolvedValue(p1);
    mockApi.deleteTaxPeriod.mockResolvedValue(undefined);
  });

  it('loadPeriods populates periods and selects first', async () => {
    const { periods, selectedPeriodId, loadPeriods } = useTaxPeriods();
    await loadPeriods();
    expect(periods.value).toStrictEqual([p1, p2]);
    expect(selectedPeriodId.value).toBe(1);
  });

  it('loadPeriods sets error on failure', async () => {
    mockApi.listTaxPeriods.mockRejectedValue(new Error('Network'));
    const { error, loadPeriods } = useTaxPeriods();
    await loadPeriods();
    expect(error.value).toBe('Network');
  });

  it('createPeriod prepends period and selects it', async () => {
    const { periods, selectedPeriodId, loadPeriods, createPeriod } = useTaxPeriods();
    await loadPeriods();
    mockApi.createTaxPeriod.mockResolvedValue({ ...p1, id: 99, name: 'New' });
    await createPeriod({ name: 'New', startDate: '2025-04-06', endDate: '2026-04-05' });
    expect(periods.value[0].id).toBe(99);
    expect(selectedPeriodId.value).toBe(99);
  });

  it('deletePeriod removes period and selects next', async () => {
    const { periods, selectedPeriodId, loadPeriods, deletePeriod } = useTaxPeriods();
    await loadPeriods();
    await deletePeriod(1);
    expect(periods.value.find((p) => p.id === 1)).toBeUndefined();
    expect(selectedPeriodId.value).toBe(2);
  });

  it('selectPeriod changes selectedPeriodId', async () => {
    const { selectedPeriodId, loadPeriods, selectPeriod } = useTaxPeriods();
    await loadPeriods();
    selectPeriod(2);
    expect(selectedPeriodId.value).toBe(2);
  });

  it('selectedPeriod returns matching period', async () => {
    const { selectedPeriod, loadPeriods, selectPeriod } = useTaxPeriods();
    await loadPeriods();
    selectPeriod(2);
    expect(selectedPeriod()?.id).toBe(2);
  });

  it('selectedPeriod returns null when none selected', () => {
    const { selectedPeriod } = useTaxPeriods();
    expect(selectedPeriod()).toBeNull();
  });
});
