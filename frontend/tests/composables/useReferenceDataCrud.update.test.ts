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

describe('useReferenceDataCrud — updateItem', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('updates item and reloads data', async () => {
    const payload: ReferenceDataPayload = { name: 'Updated', value: 'updated' } as never;
    mockReferenceDataService.update.mockResolvedValueOnce(undefined);
    mockReferenceDataService.listAll.mockResolvedValueOnce(mockData);

    const { updateItem } = useReferenceDataCrud();
    const result = await updateItem(1, payload);

    expect(result.success).toBe(true);
    expect(mockReferenceDataService.update).toHaveBeenCalledWith(1, payload);
    expect(mockReferenceDataService.listAll).toHaveBeenCalled();
  });

  it('returns error when update fails', async () => {
    const payload: ReferenceDataPayload = { name: 'Updated', value: 'updated' } as never;
    mockReferenceDataService.update.mockRejectedValueOnce({
      response: { data: { detail: 'Item not found' } },
    });

    const { updateItem } = useReferenceDataCrud();
    const result = await updateItem(1, payload);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Item not found');
    expect(mockReferenceDataService.listAll).not.toHaveBeenCalled();
  });
});

describe('useReferenceDataCrud — deleteItem', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('deletes item and reloads data', async () => {
    mockReferenceDataService.delete.mockResolvedValueOnce(undefined);
    mockReferenceDataService.listAll.mockResolvedValueOnce(mockData.slice(1));

    const { deleteItem } = useReferenceDataCrud();
    const result = await deleteItem(1);

    expect(result.success).toBe(true);
    expect(mockReferenceDataService.delete).toHaveBeenCalledWith(1);
    expect(mockReferenceDataService.listAll).toHaveBeenCalled();
  });

  it('returns error when delete fails', async () => {
    mockReferenceDataService.delete.mockRejectedValueOnce({
      response: { data: { detail: 'Cannot delete item in use' } },
    });

    const { deleteItem } = useReferenceDataCrud();
    const result = await deleteItem(1);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Cannot delete item in use');
    expect(mockReferenceDataService.listAll).not.toHaveBeenCalled();
  });
});

describe('useReferenceDataCrud — error handling', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('extracts error from response.data.detail', async () => {
    mockReferenceDataService.listAll.mockRejectedValueOnce({
      response: { data: { detail: 'Invalid request' } },
    });
    const { loadData, error } = useReferenceDataCrud();
    await loadData();
    expect(error.value).toBe('Invalid request');
  });

  it('extracts error message from Error object', async () => {
    mockReferenceDataService.listAll.mockRejectedValueOnce(new Error('Network failure'));
    const { loadData, error } = useReferenceDataCrud();
    await loadData();
    expect(error.value).toBe('Network failure');
  });

  it('handles unknown error type', async () => {
    mockReferenceDataService.listAll.mockRejectedValueOnce('Unknown error');
    const { loadData, error } = useReferenceDataCrud();
    await loadData();
    expect(error.value).toBe('An error occurred');
  });
});

describe('useReferenceDataCrud — initial state', () => {
  it('has correct initial state', () => {
    const { data, loading, error } = useReferenceDataCrud();
    expect(data.value).toEqual([]);
    expect(loading.value).toBe(false);
    expect(error.value).toBe('');
  });

  it('returns all expected functions', () => {
    const crud = useReferenceDataCrud();
    expect(typeof crud.loadData).toBe('function');
    expect(typeof crud.createItem).toBe('function');
    expect(typeof crud.updateItem).toBe('function');
    expect(typeof crud.deleteItem).toBe('function');
  });
});
