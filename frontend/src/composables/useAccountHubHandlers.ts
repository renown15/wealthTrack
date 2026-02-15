import { ref, type Ref } from 'vue';
import { usePortfolio } from '@/composables/usePortfolio';
import { useAccountHubModals } from '@/composables/useAccountHubModals';
import { accountCrudService } from '@/services/AccountCrudService';
import type { ReferenceDataItem } from '@/models/ReferenceData';

interface SavePayload {
  name: string;
  institutionId: number;
  typeId?: number;
  statusId?: number;
  openedAt?: string;
  closedAt?: string;
  accountNumber?: string;
  sortCode?: string;
  rollRefNumber?: string;
  interestRate?: string;
  fixedBonusRate?: string;
  fixedBonusRateEndDate?: string;
  parentId?: number | null;
}

export function useAccountHubHandlers(): {
  accountTypes: Ref<ReferenceDataItem[]>;
  accountStatuses: Ref<ReferenceDataItem[]>;
  handleSave: (payload: SavePayload) => Promise<void>;
  handleConfirmDelete: () => Promise<void>;
} {
  const accountTypes = ref<ReferenceDataItem[]>([]);
  const accountStatuses = ref<ReferenceDataItem[]>([]);

  const {
    state,
    createAccount,
    updateAccount,
    deleteAccount,
    createInstitution,
    updateInstitution,
    deleteInstitution,
    loadPortfolio,
  } = usePortfolio();

  const {
    modalResourceType,
    modalType,
    editingItem,
    deleteConfirmType,
    deleteConfirmId,
    closeModal,
    closeDeleteConfirm,
  } = useAccountHubModals();

  const handleSave = async (payload: SavePayload): Promise<void> => {
    try {
      if (modalResourceType.value === 'account') {
        if (modalType.value === 'create') {
          const tId = payload.typeId ?? accountTypes.value[0]?.id;
          const sId = payload.statusId ?? accountStatuses.value[0]?.id;
          if (!tId || !sId) {
            state.error = 'Select valid type and status';
            return;
          }
          await createAccount(
            payload.institutionId,
            payload.name,
            tId,
            sId,
            payload.accountNumber,
            payload.sortCode,
            payload.rollRefNumber,
            payload.interestRate,
            payload.fixedBonusRate,
            payload.fixedBonusRateEndDate
          );
        } else if (editingItem.value && 'id' in editingItem.value) {
          await updateAccount(
            editingItem.value.id,
            payload.name,
            payload.typeId,
            payload.statusId,
            payload.accountNumber,
            payload.sortCode,
            payload.rollRefNumber,
            payload.interestRate,
            payload.fixedBonusRate,
            payload.fixedBonusRateEndDate
          );
          await accountCrudService.updateAccountDates(editingItem.value.id, {
            opened_at: payload.openedAt || null,
            closed_at: payload.closedAt || null,
          });
          await loadPortfolio();
        }
      } else if (modalType.value === 'create') {
        await createInstitution(payload.name, payload.parentId || null);
      } else if (editingItem.value && 'id' in editingItem.value) {
        await updateInstitution(
          editingItem.value.id,
          payload.name,
          payload.parentId || null
        );
      }
      closeModal();
    } catch (error) {
      state.error =
        error instanceof Error ? error.message : 'An error occurred';
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    try {
      if (deleteConfirmType.value === 'account') {
        await deleteAccount(deleteConfirmId.value);
      } else {
        await deleteInstitution(deleteConfirmId.value);
      }
      closeDeleteConfirm();
    } catch {
      /* error set in state */
    }
  };

  return {
    accountTypes,
    accountStatuses,
    handleSave,
    handleConfirmDelete,
  };
}
