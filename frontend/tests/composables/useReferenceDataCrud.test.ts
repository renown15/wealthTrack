import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useReferenceDataCrud } from '@/composables/useReferenceDataCrud';
import { referenceDataService } from '@/services/ReferenceDataService';
import type { ReferenceDataItem, ReferenceDataPayload } from '@/models/ReferenceData';

vi.mock('@/services/ReferenceDataService');

const mockReferenceDataService = vi.mocked(referenceDataService);

const mockData: ReferenceDataItem[] = [
  { id: 1, name: 'Item 1', value: 'value1' } as never,
  { id: 2, name: 'Item 2', value: 'value2' } as never,
];

describe('useReferenceDataCrud — loadData', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('loads data successfully', async () => {
    mockReferenceDataService.listAll.mockResolvedValueOnce(mockData);
    const { loadData, data, loading, error } = useReferenceDataCrud();

    expect(data.value).toEqual([]);
    expect(loading.value).toBe(false);
    await loadData();
    expect(data.value).toEqual(mockData);
    expect(loading.value).toBe(false);
    expect(error.value).toBe('');
  });

  it('tracks loading state during fetch', async () => {
    mockReferenceDataService.listAll.mockImplementation(
      () => new Promise((resolve) => { setTimeout(() => resolve(mockData), 100); }),
    );
    const { loadData, loading } = useReferenceDataCrud();
    const promise = loadData();
    expect(loading.value).toBe(true);
    await promise;
    expect(loading.value).toBe(false);
  });

  it('sets error when loading fails', async () => {
    mockReferenceDataService.listAll.mockRejectedValueOnce({
      response: { data: { detail: 'Failed to load data' } },
    });
    const { loadData, error, data } = useReferenceDataCrud();
    await loadData();
    expect(error.value).toBe('Failed to load data');
    expect(data.value).toEqual([]);
  });

  it('clears previous error on successful load', async () => {
    mockReferenceDataService.listAll.mockResolvedValueOnce(mockData);
    const { loadData, error } = useReferenceDataCrud();
    error.value = 'Previous error';
    await loadData();
    expect(error.value).toBe('');
  });
});

describe('useReferenceDataCrud — createItem', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('creates item and reloads data', async () => {
    const payload: ReferenceDataPayload = { name: 'New Item', value: 'newvalue' } as never;
    mockReferenceDataService.create.mockResolvedValueOnce(undefined);
    mockReferenceDataService.listAll.mockResolvedValueOnce(mockData);

    const { createItem } = useReferenceDataCrud();
    const result = await createItem(payload);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(mockReferenceDataService.create).toHaveBeenCalledWith(payload);
    expect(mockReferenceDataService.listAll).toHaveBeenCalled();
  });

  it('returns error when create fails', async () => {
    const payload: ReferenceDataPayload = { name: 'New Item', value: 'newvalue' } as never;
    mockReferenceDataService.create.mockRejectedValueOnce({
      response: { data: { detail: 'Validation failed' } },
    });

    const { createItem, error } = useReferenceDataCrud();
    const result = await createItem(payload);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation failed');
    expect(mockReferenceDataService.listAll).not.toHaveBeenCalled();
  });

  it('handles error without response structure', async () => {
    const payload: ReferenceDataPayload = { name: 'New Item', value: 'newvalue' } as never;
    mockReferenceDataService.create.mockRejectedValueOnce(new Error('Network error'));

    const { createItem } = useReferenceDataCrud();
    const result = await createItem(payload);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });
});
