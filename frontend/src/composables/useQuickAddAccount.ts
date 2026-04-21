import { ref } from 'vue';
import type { Institution } from '@models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@models/ReferenceData';
import type { AccountFormData } from '@views/AccountHub/addAccountModalValidation';
import { apiService } from '@services/ApiService';
import { useToast } from '@composables/useToast';

export function useQuickAddAccount() {
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
    ]);
    institutions.value = insts;
    accountTypes.value = types;
    accountStatuses.value = statuses;
    institutionTypes.value = instTypes;
  }

  function getClosedStatusId(): number | null {
    return accountStatuses.value.find((s) => s.referenceValue === 'Closed')?.id ?? null;
  }

  async function createClosedAccount(data: AccountFormData): Promise<number | null> {
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
