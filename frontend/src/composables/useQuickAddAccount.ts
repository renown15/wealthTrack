import { ref, type Ref } from 'vue';
import type { Institution } from '@models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@models/ReferenceData';
import type { AccountFormData } from '@views/AccountHub/addAccountModalValidation';
import { apiService } from '@services/ApiService';
import { useToast } from '@composables/useToast';
import { isOutgoingInstitution, loadOutgoingTypes } from '@composables/outgoingTypes';

export function useQuickAddAccount(): {
  institutions: Ref<Institution[]>;
  accountTypes: Ref<ReferenceDataItem[]>;
  accountStatuses: Ref<ReferenceDataItem[]>;
  institutionTypes: Ref<ReferenceDataItem[]>;
  saving: Ref<boolean>;
  loadFormData: () => Promise<void>;
  getClosedStatusId: () => number | null;
  createClosedAccount: (data: AccountFormData) => Promise<number | null>;
} {
  const institutions = ref<Institution[]>([]);
  const accountTypes = ref<ReferenceDataItem[]>([]);
  const accountStatuses = ref<ReferenceDataItem[]>([]);
  const institutionTypes = ref<ReferenceDataItem[]>([]);
  const saving = ref(false);
  const { showError } = useToast();

  async function loadFormData(): Promise<void> {
    const [insts, types, statuses, instTypes] = await Promise.all([
      apiService.getInstitutions(),
      apiService.getReferenceData('account_type'),
      apiService.getReferenceData('account_status'),
      apiService.getReferenceData('institution_type'),
      loadOutgoingTypes(),
    ]);
    // account_type / institution_type classes are wealth-only (outgoing types have
    // their own class), so the type pickers already exclude Outgoings. Existing
    // institutions still carry outgoing type strings, so filter those out here.
    institutions.value = insts.filter((i) => !isOutgoingInstitution(i.institutionType));
    accountTypes.value = types;
    accountStatuses.value = statuses;
    institutionTypes.value = instTypes;
  }

  function getClosedStatusId(): number | null {
    return accountStatuses.value.find((s) => s.referenceValue === 'Closed')?.id ?? null;
  }

  async function createClosedAccount(data: AccountFormData): Promise<number | null> {
    if (!data.typeId || !data.statusId) {
      showError('Select valid type and status');
      return null;
    }
    saving.value = true;
    try {
      const account = await apiService.createAccount({
        institutionId: data.institutionId,
        name: data.name.trim(),
        typeId: data.typeId,
        statusId: data.statusId,
        accountNumber: data.accountNumber || undefined,
        sortCode: data.sortCode || undefined,
        rollRefNumber: data.rollRefNumber || undefined,
        interestRate: data.interestRate || undefined,
        fixedBonusRate: data.fixedBonusRate || undefined,
        fixedBonusRateEndDate: data.fixedBonusRateEndDate || undefined,
      });
      if (data.closedAt) {
        await apiService.updateAccountDates(account.id, { closed_at: data.closedAt });
      }
      return account.id;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create account');
      return null;
    } finally {
      saving.value = false;
    }
  }

  return {
    institutions,
    accountTypes,
    accountStatuses,
    institutionTypes,
    saving,
    loadFormData,
    getClosedStatusId,
    createClosedAccount,
  };
}
