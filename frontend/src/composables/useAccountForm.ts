import { ref, watch, type Ref } from 'vue';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import type { Institution } from '@/models/WealthTrackDataModels';

/**
 * Convert DD/MM/YYYY to YYYY-MM-DD for HTML date input
 */
export function convertToDateInputFormat(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  // Handle both DD/MM/YYYY and YYYY-MM-DD formats
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return dateStr;
}

/**
 * Convert YYYY-MM-DD to DD/MM/YYYY for API submission
 */
export function convertFromDateInputFormat(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

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
  releaseDate: string;
  numberOfShares: string;
  underlying: string;
  price: string;
  purchasePrice: string;
  pensionMonthlyPayment: string;
  assetClass: string;
  encumbrance: string;
  taxYear: string;
}

export interface AccountFormProps {
  open: boolean;
  resourceType: 'account' | 'institution';
  type?: 'create' | 'edit';
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
  initialReleaseDate?: string | null;
  initialNumberOfShares?: string | null;
  initialUnderlying?: string | null;
  initialPrice?: string | null;
  initialPurchasePrice?: string | null;
  initialPensionMonthlyPayment?: string | null;
  initialAssetClass?: string | null;
  initialEncumbrance?: string | null;
  initialTaxYear?: string | null;
  accountTypes: ReferenceDataItem[];
  accountStatuses: ReferenceDataItem[];
  institutions?: Institution[];
}

export function useAccountForm(props: Ref<AccountFormProps>): { formData: Ref<AccountFormData>; resetForm: () => void } {
  // Only default openedAt to today for new accounts (type === 'create')
  const getDefaultOpenDate = (): string => {
    if (props.value.initialOpenedAt !== undefined && props.value.initialOpenedAt !== null) {
      return props.value.initialOpenedAt;
    }
    // For create, default to today; for edit, preserve null/empty
    if (props.value.type === 'create') {
      return new Date().toISOString().slice(0, 10);
    }
    return props.value.initialOpenedAt || '';
  };

  const formData = ref<AccountFormData>({
    name: props.value.initialName || '',
    institutionId: props.value.initialInstitutionId || 0,
    typeId: props.value.initialTypeId || 0,
    statusId: props.value.initialStatusId || 0,
    openedAt: getDefaultOpenDate(),
    closedAt: props.value.initialClosedAt || '',
    accountNumber: props.value.initialAccountNumber || '',
    sortCode: props.value.initialSortCode || '',
    rollRefNumber: props.value.initialRollRefNumber || '',
    interestRate: props.value.initialInterestRate || '',
    fixedBonusRate: props.value.initialFixedBonusRate || '',
    fixedBonusRateEndDate: props.value.initialFixedBonusRateEndDate || '',
    releaseDate: props.value.initialReleaseDate || '',
    numberOfShares: props.value.initialNumberOfShares || '',
    underlying: props.value.initialUnderlying || '',
    price: props.value.initialPrice || '',
    purchasePrice: props.value.initialPurchasePrice || '',
    pensionMonthlyPayment: props.value.initialPensionMonthlyPayment || '',
    assetClass: props.value.initialAssetClass || '',
    encumbrance: props.value.initialEncumbrance || '',
    taxYear: props.value.initialTaxYear || '',
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
    // Only default openedAt to today for new accounts
    if (props.value.initialOpenedAt) {
      formData.value.openedAt = convertToDateInputFormat(props.value.initialOpenedAt);
    } else if (props.value.type === 'create') {
      formData.value.openedAt = new Date().toISOString().slice(0, 10);
    } else {
      formData.value.openedAt = '';
    }
    formData.value.closedAt = convertToDateInputFormat(props.value.initialClosedAt);
    formData.value.accountNumber = props.value.initialAccountNumber || '';
    formData.value.sortCode = props.value.initialSortCode || '';
    formData.value.rollRefNumber = props.value.initialRollRefNumber || '';
    formData.value.interestRate = props.value.initialInterestRate || '';
    formData.value.fixedBonusRate = props.value.initialFixedBonusRate || '';
    formData.value.fixedBonusRateEndDate = convertToDateInputFormat(props.value.initialFixedBonusRateEndDate);
    formData.value.releaseDate = convertToDateInputFormat(props.value.initialReleaseDate);
    formData.value.numberOfShares = props.value.initialNumberOfShares || '';
    formData.value.underlying = props.value.initialUnderlying || '';
    formData.value.price = props.value.initialPrice || '';
    formData.value.purchasePrice = props.value.initialPurchasePrice || '';
    formData.value.pensionMonthlyPayment = props.value.initialPensionMonthlyPayment || '';
    formData.value.assetClass = props.value.initialAssetClass || '';
    formData.value.encumbrance = props.value.initialEncumbrance || '';
    formData.value.taxYear = props.value.initialTaxYear || '';
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

  const syncTaxLiabilityName = (): void => {
    const typeName = props.value.accountTypes.find(
      (t) => t.id === formData.value.typeId,
    )?.referenceValue;
    if (typeName === 'Tax Liability' && formData.value.taxYear) {
      formData.value.name = `Tax Liability - ${formData.value.taxYear}`;
    }
  };

  watch(() => formData.value.typeId, () => {
    syncTaxLiabilityName();
    const typeName = props.value.accountTypes.find(
      (t) => t.id === formData.value.typeId,
    )?.referenceValue;
    if (typeName === 'Tax Liability') {
      const hmrc = props.value.institutions?.find(
        (i) => i.name.toLowerCase() === 'hmrc',
      );
      if (hmrc) formData.value.institutionId = hmrc.id;
      // Only default openedAt to today for new accounts
      if (props.value.type === 'create' && !formData.value.openedAt) {
        formData.value.openedAt = new Date().toISOString().slice(0, 10);
      }
    }
  });

  watch(() => formData.value.taxYear, syncTaxLiabilityName);

  return { formData, resetForm };
}
