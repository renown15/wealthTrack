import { type Ref } from 'vue';
import { usePortfolio } from '@/composables/usePortfolio';
import type { Account, Institution } from '@/models/WealthTrackDataModels';

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
      // eslint-disable-next-line no-console
      console.log('[InstitutionCrudHandlers] handleSave called', { modalType: modalType.value, hasEditingItem: !!editingItem.value, editingItemId: editingItem.value?.id });
      
      if (modalType.value === 'create') {
        // eslint-disable-next-line no-console
        console.log('[InstitutionCrudHandlers] Taking CREATE path');
        await createInstitution(payload.name, payload.parentId || null, payload.institutionType || null);
      } else if (editingItem.value && 'id' in editingItem.value) {
        // eslint-disable-next-line no-console
        console.log('[InstitutionCrudHandlers] Taking UPDATE path', { institutionId: editingItem.value.id });
        await updateInstitution(
          editingItem.value.id,
          payload.name,
          payload.parentId || null,
          payload.institutionType || null
        );
      } else {
        // eslint-disable-next-line no-console
        console.log('[InstitutionCrudHandlers] No path taken - neither create nor edit conditions met');
      }
      closeModal();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      state.error = errorMessage;
    }
  };

  const handleDelete = async (institutionId: number): Promise<void> => {
    // eslint-disable-next-line no-console
    console.log('[INSTITUTION HANDLER] DELETE CALLED', { institutionId });
    try {
      // eslint-disable-next-line no-console
      console.log('[InstitutionCrudHandlers] handleDelete called', { institutionId });
      await deleteInstitution(institutionId);
      // eslint-disable-next-line no-console
      console.log('[InstitutionCrudHandlers] Institution deleted successfully', { institutionId });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[InstitutionCrudHandlers] Delete failed:', error);
      // error is already set in state by deleteInstitution
    }
  };

  return {
    handleSave,
    handleDelete,
  };
}
