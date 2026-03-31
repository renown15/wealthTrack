import { type Ref } from 'vue';
import { usePortfolio } from '@/composables/usePortfolio';
import type { Account, Institution } from '@/models/WealthTrackDataModels';
import { debug } from '@/utils/debug';

export interface InstitutionSavePayload {
  name: string;
  parentId?: number | null;
  institutionType?: string | null;
}

export interface UseInstitutionCrudHandlersReturn {
  handleSave: (payload: InstitutionSavePayload) => Promise<void>;
  handleDelete: (institutionId: number) => Promise<void>;
}

/**
 * Institution CRUD operation handlers
 * Manages create, update, and delete operations for institutions
 */
export function useInstitutionCrudHandlers(
  modalType: Ref<'create' | 'edit'>,
  editingItem: Ref<Account | Institution | null>,
  closeModal: () => void
): UseInstitutionCrudHandlersReturn {
  const { state, createInstitution, updateInstitution, deleteInstitution } =
    usePortfolio();

  const handleSave = async (payload: InstitutionSavePayload): Promise<void> => {
    try {
      if (modalType.value === 'create') {
        await createInstitution(payload.name, payload.parentId || null, payload.institutionType || null);
      } else if (editingItem.value && 'id' in editingItem.value) {
        await updateInstitution(
          editingItem.value.id,
          payload.name,
          payload.parentId || null,
          payload.institutionType || null
        );
      }
      closeModal();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      state.error = errorMessage;
    }
  };

  const handleDelete = async (institutionId: number): Promise<void> => {
    try {
      await deleteInstitution(institutionId);
    } catch (error) {
      debug.error('[InstitutionCrudHandlers] Delete failed:', error);
      // error is already set in state by deleteInstitution
    }
  };

  return {
    handleSave,
    handleDelete,
  };
}
