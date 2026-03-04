<template>
  <BaseResourceModal
    :open="open"
    :title="modalTitle"
    :save-button-text="type === 'create' ? 'Create' : 'Save'"
    @close="emitClose"
    @save="handleSave"
  >
    <div v-if="error" class="error-banner mb-4">{{ error }}</div>
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
import { computed, toRef } from 'vue';
import type { Institution } from '@/models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import BaseResourceModal from '@/components/BaseResourceModal.vue';
import AccountFormFields from '@views/AccountHub/AccountFormFields.vue';
import { useAccountForm, type AccountFormProps } from '@/composables/useAccountForm';

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
  accountTypes: props.accountTypes,
  accountStatuses: props.accountStatuses,
}));

const { formData } = useAccountForm(toRef(formProps));

const modalTitle = computed(() => {
  const verb = props.type === 'create' ? 'New' : 'Edit';
  return `${verb} Account`;
});

const emitClose = (): void => emit('close');

const handleSave = (): void => {
  console.log('[AccountModal] handleSave called', {
    name: formData.value.name,
    institutionId: formData.value.institutionId,
    typeId: formData.value.typeId,
    statusId: formData.value.statusId,
    type: props.type,
  });

  if (!formData.value.name) {
    console.log('[AccountModal] Validation failed: no name');
    return;
  }
  if (props.type === 'create' && !formData.value.institutionId) {
    console.log('[AccountModal] Validation failed: create but no institution');
    return;
  }
  if (!formData.value.typeId || !formData.value.statusId) {
    console.log('[AccountModal] Validation failed: no typeId or statusId', {
      typeId: formData.value.typeId,
      statusId: formData.value.statusId,
    });
    return;
  }

  console.log('[AccountModal] Validation passed, emitting save');
  emit('save', {
    name: formData.value.name,
    institutionId: formData.value.institutionId,
    typeId: formData.value.typeId,
    statusId: formData.value.statusId,
    openedAt: formData.value.openedAt || undefined,
    closedAt: formData.value.closedAt || undefined,
    accountNumber: formData.value.accountNumber || undefined,
    sortCode: formData.value.sortCode || undefined,
    rollRefNumber: formData.value.rollRefNumber || undefined,
    interestRate: formData.value.interestRate || undefined,
    fixedBonusRate: formData.value.fixedBonusRate || undefined,
    fixedBonusRateEndDate: formData.value.fixedBonusRateEndDate || undefined,
    releaseDate: formData.value.releaseDate || undefined,
    numberOfShares: formData.value.numberOfShares || undefined,
    underlying: formData.value.underlying || undefined,
    price: formData.value.price || undefined,
    purchasePrice: formData.value.purchasePrice || undefined,
    pensionMonthlyPayment: formData.value.pensionMonthlyPayment || undefined,
  });
};
</script>
