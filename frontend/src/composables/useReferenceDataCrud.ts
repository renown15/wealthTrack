import { ref, type Ref } from 'vue';
import { referenceDataService } from '@/services/ReferenceDataService';
import type { ReferenceDataItem, ReferenceDataPayload } from '@/models/ReferenceData';

interface CrudState {
  loading: Ref<boolean>;
  error: Ref<string>;
  data: Ref<ReferenceDataItem[]>;
}

interface CrudOperations {
  loadData: () => Promise<void>;
  createItem: (payload: ReferenceDataPayload) => Promise<{ success: boolean; error?: string }>;
  updateItem: (id: number, payload: ReferenceDataPayload) => Promise<{ success: boolean; error?: string }>;
  deleteItem: (id: number) => Promise<{ success: boolean; error?: string }>;
}

interface UseReferenceDataCrudReturn extends CrudState, CrudOperations {}

/**
 * Reference data CRUD operations composable
 * Handles all API calls and state management
 */
export function useReferenceDataCrud(): UseReferenceDataCrudReturn {
  const loading = ref(false);
  const error = ref('');
  const data = ref<ReferenceDataItem[]>([]);

  const extractError = (err: unknown): string => {
    if (
      err &&
      typeof err === 'object' &&
      'response' in err &&
      err.response &&
      typeof err.response === 'object' &&
      'data' in err.response &&
      err.response.data &&
      typeof err.response.data === 'object' &&
      'detail' in err.response.data
    ) {
      return String(err.response.data.detail);
    }
    if (err instanceof Error) {
      return err.message;
    }
    return 'An error occurred';
  };

  const loadData = async (): Promise<void> => {
    try {
      loading.value = true;
      error.value = '';
      const result = await referenceDataService.listAll();
      data.value = result;
    } catch (err) {
      error.value = extractError(err);
    } finally {
      loading.value = false;
    }
  };

  const createItem = async (
    payload: ReferenceDataPayload
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      error.value = '';
      await referenceDataService.create(payload);
      await loadData();
      return { success: true };
    } catch (err) {
      const errorMsg = extractError(err);
      return { success: false, error: errorMsg };
    }
  };

  const updateItem = async (
    id: number,
    payload: ReferenceDataPayload
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      error.value = '';
      await referenceDataService.update(id, payload);
      await loadData();
      return { success: true };
    } catch (err) {
      const errorMsg = extractError(err);
      return { success: false, error: errorMsg };
    }
  };

  const deleteItem = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      error.value = '';
      await referenceDataService.delete(id);
      await loadData();
      return { success: true };
    } catch (err) {
      const errorMsg = extractError(err);
      return { success: false, error: errorMsg };
    }
  };

  return {
    loading,
    error,
    data,
    loadData,
    createItem,
    updateItem,
    deleteItem,
  };
}
