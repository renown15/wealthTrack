import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useReferenceDataCrud } from '@/composables/useReferenceDataCrud';
import { referenceDataService } from '@/services/ReferenceDataService';
import type { ReferenceDataItem, ReferenceDataPayload } from '@/models/ReferenceData';

vi.mock('@/services/ReferenceDataService');

const mockReferenceDataService = vi.mocked(referenceDataService);

const mockData: ReferenceDataItem[] = [
  { id: 1, name: 'Item 1', value: 'value1' },
  { id: 2, name: 'Item 2', value: 'value2' },
];

describe('useReferenceDataCrud', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadData', () => {
    it('should load data successfully', async () => {
      mockReferenceDataService.listAll.mockResolvedValueOnce(mockData);

      const { loadData, data, loading, error } = useReferenceDataCrud();

      expect(data.value).toEqual([]);
      expect(loading.value).toBe(false);

      await loadData();

      expect(data.value).toEqual(mockData);
      expect(loading.value).toBe(false);
      expect(error.value).toBe('');
    });

    it('should handle loading state during fetch', async () => {
      mockReferenceDataService.listAll.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockData), 100);
          })
      );

      const { loadData, loading } = useReferenceDataCrud();

      const promise = loadData();
      // Loading should start
      expect(loading.value).toBe(true);

      await promise;
      expect(loading.value).toBe(false);
    });

    it('should handle error when loading data fails', async () => {
      const errorDetail = 'Failed to load data';
      mockReferenceDataService.listAll.mockRejectedValueOnce({
        response: {
          data: {
            detail: errorDetail,
          },
        },
      });

      const { loadData, error, data } = useReferenceDataCrud();

      await loadData();

      expect(error.value).toBe(errorDetail);
      expect(data.value).toEqual([]);
    });

    it('should clear error on successful load', async () => {
      mockReferenceDataService.listAll.mockResolvedValueOnce(mockData);

      const { loadData, error } = useReferenceDataCrud();

      // Simulate previous error
      error.value = 'Previous error';

      await loadData();

      expect(error.value).toBe('');
      expect(mockReferenceDataService.listAll).toHaveBeenCalled();
    });
  });

  describe('createItem', () => {
    it('should create item and reload data', async () => {
      const payload: ReferenceDataPayload = { name: 'New Item', value: 'newvalue' };
      mockReferenceDataService.create.mockResolvedValueOnce(undefined);
      mockReferenceDataService.listAll.mockResolvedValueOnce(mockData);

      const { createItem } = useReferenceDataCrud();

      const result = await createItem(payload);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockReferenceDataService.create).toHaveBeenCalledWith(payload);
      expect(mockReferenceDataService.listAll).toHaveBeenCalled();
    });

    it('should return error when create fails', async () => {
      const payload: ReferenceDataPayload = { name: 'New Item', value: 'newvalue' };
      const errorDetail = 'Validation failed';
      mockReferenceDataService.create.mockRejectedValueOnce({
        response: {
          data: {
            detail: errorDetail,
          },
        },
      });

      const { createItem, error } = useReferenceDataCrud();

      const result = await createItem(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorDetail);
      expect(mockReferenceDataService.listAll).not.toHaveBeenCalled();
    });

    it('should handle error without response structure', async () => {
      const payload: ReferenceDataPayload = { name: 'New Item', value: 'newvalue' };
      const errorMsg = 'Network error';
      mockReferenceDataService.create.mockRejectedValueOnce(new Error(errorMsg));

      const { createItem } = useReferenceDataCrud();

      const result = await createItem(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMsg);
    });
  });

  describe('updateItem', () => {
    it('should update item and reload data', async () => {
      const id = 1;
      const payload: ReferenceDataPayload = { name: 'Updated', value: 'updated' };
      mockReferenceDataService.update.mockResolvedValueOnce(undefined);
      mockReferenceDataService.listAll.mockResolvedValueOnce(mockData);

      const { updateItem } = useReferenceDataCrud();

      const result = await updateItem(id, payload);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockReferenceDataService.update).toHaveBeenCalledWith(id, payload);
      expect(mockReferenceDataService.listAll).toHaveBeenCalled();
    });

    it('should return error when update fails', async () => {
      const id = 1;
      const payload: ReferenceDataPayload = { name: 'Updated', value: 'updated' };
      const errorDetail = 'Item not found';
      mockReferenceDataService.update.mockRejectedValueOnce({
        response: {
          data: {
            detail: errorDetail,
          },
        },
      });

      const { updateItem } = useReferenceDataCrud();

      const result = await updateItem(id, payload);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorDetail);
      expect(mockReferenceDataService.listAll).not.toHaveBeenCalled();
    });
  });

  describe('deleteItem', () => {
    it('should delete item and reload data', async () => {
      const id = 1;
      mockReferenceDataService.delete.mockResolvedValueOnce(undefined);
      mockReferenceDataService.listAll.mockResolvedValueOnce(mockData.slice(1));

      const { deleteItem } = useReferenceDataCrud();

      const result = await deleteItem(id);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockReferenceDataService.delete).toHaveBeenCalledWith(id);
      expect(mockReferenceDataService.listAll).toHaveBeenCalled();
    });

    it('should return error when delete fails', async () => {
      const id = 1;
      const errorDetail = 'Cannot delete item in use';
      mockReferenceDataService.delete.mockRejectedValueOnce({
        response: {
          data: {
            detail: errorDetail,
          },
        },
      });

      const { deleteItem } = useReferenceDataCrud();

      const result = await deleteItem(id);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorDetail);
      expect(mockReferenceDataService.listAll).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should extract error from response.data.detail', async () => {
      const errorDetail = 'Invalid request';
      mockReferenceDataService.listAll.mockRejectedValueOnce({
        response: {
          data: {
            detail: errorDetail,
          },
        },
      });

      const { loadData, error } = useReferenceDataCrud();
      await loadData();

      expect(error.value).toBe(errorDetail);
    });

    it('should extract error message from Error object', async () => {
      const errorMsg = 'Network failure';
      mockReferenceDataService.listAll.mockRejectedValueOnce(new Error(errorMsg));

      const { loadData, error } = useReferenceDataCrud();
      await loadData();

      expect(error.value).toBe(errorMsg);
    });

    it('should handle unknown error type', async () => {
      mockReferenceDataService.listAll.mockRejectedValueOnce('Unknown error');

      const { loadData, error } = useReferenceDataCrud();
      await loadData();

      expect(error.value).toBe('An error occurred');
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { data, loading, error } = useReferenceDataCrud();

      expect(data.value).toEqual([]);
      expect(loading.value).toBe(false);
      expect(error.value).toBe('');
    });

    it('should return all expected functions', () => {
      const crud = useReferenceDataCrud();

      expect(typeof crud.loadData).toBe('function');
      expect(typeof crud.createItem).toBe('function');
      expect(typeof crud.updateItem).toBe('function');
      expect(typeof crud.deleteItem).toBe('function');
    });
  });
});
