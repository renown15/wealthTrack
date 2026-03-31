import { type Ref } from 'vue';
import { usePortfolio } from '@/composables/usePortfolio';
import { accountCrudService } from '@/services/AccountCrudService';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import type { Account, Institution } from '@/models/WealthTrackDataModels';
import { debug } from '@/utils/debug';

export interface AccountSavePayload {
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
  releaseDate?: string;
  numberOfShares?: string;
  underlying?: string;
  price?: string;
  purchasePrice?: string;
  pensionMonthlyPayment?: string;
  assetClass?: string;
}

export interface UseAccountCrudHandlersReturn {
  accountTypes: Ref<ReferenceDataItem[]>;
  accountStatuses: Ref<ReferenceDataItem[]>;
  handleSave: (payload: AccountSavePayload) => Promise<void>;
  handleDelete: (accountId: number) => Promise<void>;
}

/**
 * Account CRUD operation handlers
 * Manages create, update, and delete operations for accounts
 */
export function useAccountCrudHandlers(
  accountTypes: Ref<ReferenceDataItem[]>,
  accountStatuses: Ref<ReferenceDataItem[]>,
  modalType: Ref<'create' | 'edit'>,
  editingItem: Ref<Account | Institution | null>,
  closeModal: () => void
): UseAccountCrudHandlersReturn {
  const { state, createAccount, updateAccount, deleteAccount, loadPortfolio } =
    usePortfolio();

  const handleSave = async (payload: AccountSavePayload): Promise<void> => {
    try {
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
          payload.fixedBonusRateEndDate,
          payload.releaseDate,
          payload.numberOfShares,
          payload.underlying,
          payload.price,
          payload.purchasePrice,
          payload.pensionMonthlyPayment,
          payload.assetClass
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
          payload.fixedBonusRateEndDate,
          payload.releaseDate,
          payload.numberOfShares,
          payload.underlying,
          payload.price,
          payload.purchasePrice,
          payload.pensionMonthlyPayment,
          payload.assetClass
        );
        try {
          await accountCrudService.updateAccountDates(editingItem.value.id, {
            opened_at: payload.openedAt || null,
            closed_at: payload.closedAt || null,
          });
        } catch (datesError) {
          debug.error('[AccountCrudHandlers] Failed to update account dates:', datesError);
          // Continue - dates are optional
        }
        await loadPortfolio();
      }
      closeModal();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      state.error = errorMessage;
    }
  };

  const handleDelete = async (accountId: number): Promise<void> => {
    try {
      await deleteAccount(accountId);
    } catch (error) {
      debug.error('[AccountCrudHandlers] Delete failed:', error);
      throw error;
    }
  };

  return {
    accountTypes,
    accountStatuses,
    handleSave,
    handleDelete,
  };
}
