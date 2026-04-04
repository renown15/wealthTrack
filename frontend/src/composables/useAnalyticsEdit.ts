import { ref, onMounted } from 'vue';
import { apiService } from '@/services/ApiService';
import type { Account, Institution, AccountUpdateRequest } from '@/models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import { debug } from '@/utils/debug';

export interface AnalyticsEditSavePayload {
  name: string;
  institutionId: number;
  typeId: number;
  statusId: number;
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
  encumbrance?: string;
}

export function useAnalyticsEdit(onSaved?: () => Promise<void> | void) {
  const editingAccount = ref<Account | null>(null);
  const editModalOpen = ref(false);
  const editModalError = ref<string | null>(null);
  const institutions = ref<Institution[]>([]);
  const accountTypes = ref<ReferenceDataItem[]>([]);
  const accountStatuses = ref<ReferenceDataItem[]>([]);

  onMounted(async () => {
    try {
      const [insts, types, statuses] = await Promise.all([
        apiService.getInstitutions(),
        apiService.getReferenceData('account_type'),
        apiService.getReferenceData('account_status'),
      ]);
      institutions.value = insts;
      accountTypes.value = types;
      accountStatuses.value = statuses;
    } catch (e) {
      debug.error('[useAnalyticsEdit] Failed to load reference data', e);
    }
  });

  async function openEdit(accountId: number): Promise<void> {
    editModalError.value = null;
    try {
      editingAccount.value = await apiService.getAccount(accountId);
      editModalOpen.value = true;
    } catch (e) {
      debug.error('[useAnalyticsEdit] Failed to load account', e);
    }
  }

  async function handleSave(payload: AnalyticsEditSavePayload): Promise<void> {
    if (!editingAccount.value) return;
    editModalError.value = null;
    try {
      const update: AccountUpdateRequest = {
        name: payload.name,
        typeId: payload.typeId,
        statusId: payload.statusId,
        accountNumber: payload.accountNumber,
        sortCode: payload.sortCode,
        rollRefNumber: payload.rollRefNumber,
        interestRate: payload.interestRate,
        fixedBonusRate: payload.fixedBonusRate,
        fixedBonusRateEndDate: payload.fixedBonusRateEndDate,
        releaseDate: payload.releaseDate,
        numberOfShares: payload.numberOfShares,
        underlying: payload.underlying,
        price: payload.price,
        purchasePrice: payload.purchasePrice,
        pensionMonthlyPayment: payload.pensionMonthlyPayment,
        assetClass: payload.assetClass,
        encumbrance: payload.encumbrance,
      };
      await apiService.updateAccount(editingAccount.value.id, update);
      editModalOpen.value = false;
      editingAccount.value = null;
      await onSaved?.();
    } catch (e) {
      editModalError.value = e instanceof Error ? e.message : 'Failed to save account';
    }
  }

  function closeEdit(): void {
    editModalOpen.value = false;
    editingAccount.value = null;
    editModalError.value = null;
  }

  return {
    editingAccount, editModalOpen, editModalError,
    institutions, accountTypes, accountStatuses,
    openEdit, handleSave, closeEdit,
  };
}
