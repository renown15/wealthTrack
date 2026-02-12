import { ref, watch, type Ref } from 'vue';
import type { ReferenceDataItem } from '@/models/ReferenceData';

export interface AccountFormData {
  name: string;
  institutionId: number;
  typeId: number;
  statusId: number;
  openedAt: string;
  closedAt: string;
  accountNumber: string;
  sortCode: string;
  rollRefNumber: string;
  interestRate: string;
  fixedBonusRate: string;
  fixedBonusRateEndDate: string;
}

export interface AccountFormProps {
  open: boolean;
  resourceType: 'account' | 'institution';
  initialName?: string;
  initialInstitutionId?: number;
  initialTypeId?: number;
  initialStatusId?: number;
  initialOpenedAt?: string | null;
  initialClosedAt?: string | null;
  initialAccountNumber?: string | null;
  initialSortCode?: string | null;
  initialRollRefNumber?: string | null;
  initialInterestRate?: string | null;
  initialFixedBonusRate?: string | null;
  initialFixedBonusRateEndDate?: string | null;
  accountTypes: ReferenceDataItem[];
  accountStatuses: ReferenceDataItem[];
}

export function useAccountForm(props: Ref<AccountFormProps>): { formData: Ref<AccountFormData>; resetForm: () => void } {
  const formData = ref<AccountFormData>({
    name: props.value.initialName || '',
    institutionId: props.value.initialInstitutionId || 0,
    typeId: props.value.initialTypeId || 0,
    statusId: props.value.initialStatusId || 0,
    openedAt: props.value.initialOpenedAt || '',
    closedAt: props.value.initialClosedAt || '',
    accountNumber: props.value.initialAccountNumber || '',
    sortCode: props.value.initialSortCode || '',
    rollRefNumber: props.value.initialRollRefNumber || '',
    interestRate: props.value.initialInterestRate || '',
    fixedBonusRate: props.value.initialFixedBonusRate || '',
    fixedBonusRateEndDate: props.value.initialFixedBonusRateEndDate || '',
  });

  const syncAccountType = (): void => {
    if (props.value.resourceType !== 'account' || !props.value.accountTypes.length) {
      return;
    }
    if (
      props.value.initialTypeId &&
      props.value.accountTypes.some((t) => t.id === props.value.initialTypeId)
    ) {
      formData.value.typeId = props.value.initialTypeId;
      return;
    }
    if (
      formData.value.typeId &&
      props.value.accountTypes.some((t) => t.id === formData.value.typeId)
    ) {
      return;
    }
    formData.value.typeId = props.value.accountTypes[0].id;
  };

  const syncAccountStatus = (): void => {
    if (props.value.resourceType !== 'account' || !props.value.accountStatuses.length) {
      return;
    }
    if (
      props.value.initialStatusId &&
      props.value.accountStatuses.some((s) => s.id === props.value.initialStatusId)
    ) {
      formData.value.statusId = props.value.initialStatusId;
      return;
    }
    if (
      formData.value.statusId &&
      props.value.accountStatuses.some((s) => s.id === formData.value.statusId)
    ) {
      return;
    }
    formData.value.statusId = props.value.accountStatuses[0].id;
  };

  const resetForm = (): void => {
    formData.value.name = props.value.initialName || '';
    formData.value.institutionId = props.value.initialInstitutionId || 0;
    formData.value.typeId = props.value.initialTypeId || 0;
    formData.value.statusId = props.value.initialStatusId || 0;
    formData.value.openedAt = props.value.initialOpenedAt || '';
    formData.value.closedAt = props.value.initialClosedAt || '';
    formData.value.accountNumber = props.value.initialAccountNumber || '';
    formData.value.sortCode = props.value.initialSortCode || '';
    formData.value.rollRefNumber = props.value.initialRollRefNumber || '';
    formData.value.interestRate = props.value.initialInterestRate || '';
    formData.value.fixedBonusRate = props.value.initialFixedBonusRate || '';
    formData.value.fixedBonusRateEndDate = props.value.initialFixedBonusRateEndDate || '';
    syncAccountType();
    syncAccountStatus();
  };

  watch(() => props.value.open, (newOpen) => {
    if (newOpen) resetForm();
  });

  watch(() => props.value.accountTypes, () => {
    if (props.value.open) syncAccountType();
  }, { deep: true });

  watch(() => props.value.accountStatuses, () => {
    if (props.value.open) syncAccountStatus();
  }, { deep: true });

  return { formData, resetForm };
}
