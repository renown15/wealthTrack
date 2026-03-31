<template>
  <BaseResourceModal
    :open="open"
    :title="modalTitle"
    :save-button-text="type === 'create' ? 'Create' : 'Save'"
    @close="emitClose"
    @save="handleSave"
  >
    <div v-if="validationError || error" class="error-banner mb-4">{{ validationError || error }}</div>
    <AccountFormFields
      :form-data="formData"
      :type="type"
      :institutions="institutions"
      :account-types="accountTypes"
      :account-statuses="accountStatuses"
    />
  </BaseResourceModal>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import type { Institution } from '@/models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import BaseResourceModal from '@/components/BaseResourceModal.vue';
import AccountFormFields from '@views/AccountHub/AccountFormFields.vue';
import { useAccountForm, type AccountFormProps, convertFromDateInputFormat } from '@/composables/useAccountForm';
import { validatePenceField } from '@views/AccountHub/addAccountModalValidation';

interface Props {
  open: boolean;
  type: 'create' | 'edit';
  institutions: Institution[];
  accountTypes: ReferenceDataItem[];
  accountStatuses: ReferenceDataItem[];
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
  error?: string | null;
}

interface SavePayload {
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
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  save: [SavePayload];
}>();

const formProps = computed<AccountFormProps>(() => ({
  open: props.open,
  resourceType: 'account',
  initialName: props.initialName,
  initialInstitutionId: props.initialInstitutionId,
  initialTypeId: props.initialTypeId,
  initialStatusId: props.initialStatusId,
  initialOpenedAt: props.initialOpenedAt,
  initialClosedAt: props.initialClosedAt,
  initialAccountNumber: props.initialAccountNumber,
  initialSortCode: props.initialSortCode,
  initialRollRefNumber: props.initialRollRefNumber,
  initialInterestRate: props.initialInterestRate,
  initialFixedBonusRate: props.initialFixedBonusRate,
  initialFixedBonusRateEndDate: props.initialFixedBonusRateEndDate,
  initialReleaseDate: props.initialReleaseDate,
  initialNumberOfShares: props.initialNumberOfShares,
  initialUnderlying: props.initialUnderlying,
  initialPrice: props.initialPrice,
  initialPurchasePrice: props.initialPurchasePrice,
  initialPensionMonthlyPayment: props.initialPensionMonthlyPayment,
  initialAssetClass: props.initialAssetClass,
  accountTypes: props.accountTypes,
  accountStatuses: props.accountStatuses,
}));

const { formData } = useAccountForm(toRef(formProps));
const validationError = ref('');

const modalTitle = computed(() => {
  const verb = props.type === 'create' ? 'New' : 'Edit';
  return `${verb} Account`;
});

const emitClose = (): void => emit('close');

const handleSave = (): void => {
  validationError.value = '';

  if (!formData.value.name) {
    validationError.value = 'Please enter an account name';
    return;
  }
  if (props.type === 'create' && !formData.value.institutionId) {
    validationError.value = 'Please select an institution';
    return;
  }
  if (!formData.value.typeId || !formData.value.statusId) {
    validationError.value = 'Please select an account type and status';
    return;
  }

  const priceErr = validatePenceField(formData.value.price, 'Price')
    ?? validatePenceField(formData.value.purchasePrice, 'Purchase Price');
  if (priceErr) {
    validationError.value = priceErr;
    return;
  }
  emit('save', {
    name: formData.value.name,
    institutionId: formData.value.institutionId,
    typeId: formData.value.typeId,
    statusId: formData.value.statusId,
    openedAt: formData.value.openedAt ? convertFromDateInputFormat(formData.value.openedAt) : undefined,
    closedAt: formData.value.closedAt ? convertFromDateInputFormat(formData.value.closedAt) : undefined,
    accountNumber: formData.value.accountNumber || undefined,
    sortCode: formData.value.sortCode || undefined,
    rollRefNumber: formData.value.rollRefNumber || undefined,
    interestRate: formData.value.interestRate || undefined,
    fixedBonusRate: formData.value.fixedBonusRate || undefined,
    fixedBonusRateEndDate: formData.value.fixedBonusRateEndDate ? convertFromDateInputFormat(formData.value.fixedBonusRateEndDate) : undefined,
    releaseDate: formData.value.releaseDate ? convertFromDateInputFormat(formData.value.releaseDate) : undefined,
    numberOfShares: formData.value.numberOfShares || undefined,
    underlying: formData.value.underlying || undefined,
    price: formData.value.price || undefined,
    purchasePrice: formData.value.purchasePrice || undefined,
    pensionMonthlyPayment: formData.value.pensionMonthlyPayment || undefined,
    assetClass: formData.value.assetClass || undefined,
  });
};
</script>
