<template>
  <BaseModal
    :open="open"
    :title="modalTitle"
    size="medium"
    @close="emitClose"
  >
    <template #default>
      <div v-if="validationError" class="error-banner mb-4">
        {{ validationError }}
      </div>

      <InstitutionFormFields
        v-if="resourceType === 'institution'"
        :model-value="{
          name: institutionFormData.name,
          parentId: institutionFormData.parentId,
          institutionType: institutionFormData.institutionType,
        }"
        :institutions="institutions"
        :institution-types="institutionTypes"
        @update:name="(v) => institutionFormData.name = v"
        @update:parentId="(v) => institutionFormData.parentId = v"
        @update:institutionType="(v) => institutionFormData.institutionType = v"
      />

      <AccountFormFields
        v-if="resourceType === 'account'"
        :form-data="formData"
        :type="type"
        :institutions="institutions"
        :account-types="accountTypes"
        :account-statuses="accountStatuses"
      />
    </template>

    <template #footer>
      <button class="btn-modal-secondary" @click="emitClose">Cancel</button>
      <button class="btn-primary" @click="handleSave">
        {{ type === 'create' ? 'Create' : 'Save' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Institution } from '@/models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import BaseModal from '@/components/BaseModal.vue';
import AccountFormFields from '@views/AccountHub/AccountFormFields.vue';
import InstitutionFormFields from '@views/AccountHub/InstitutionFormFields.vue';
import { validateAccountForm, validateInstitutionForm, type AccountFormData } from '@views/AccountHub/addAccountModalValidation';

interface InstitutionFormData {
  name: string;
  parentId?: number;
  institutionType?: string | null;
}

interface Props {
  open: boolean;
  type: 'create' | 'edit';
  resourceType: 'account' | 'institution';
  institutions: Institution[];
  accountTypes: ReferenceDataItem[];
  accountStatuses: ReferenceDataItem[];
  institutionTypes: ReferenceDataItem[];
  initialAccountData?: Partial<AccountFormData>;
  initialInstitutionData?: Partial<InstitutionFormData>;
}

const props = withDefaults(defineProps<Props>(), {
  resourceType: 'account',
});

const emit = defineEmits<{
  close: [];
  save: [data: any];
}>();

const formData = ref<AccountFormData>({
  name: '',
  institutionId: 0,
  typeId: undefined,
  statusId: undefined,
  openedAt: undefined,
  closedAt: undefined,
  accountNumber: undefined,
  sortCode: undefined,
  rollRefNumber: undefined,
  interestRate: undefined,
  fixedBonusRate: undefined,
  fixedBonusRateEndDate: undefined,
  releaseDate: undefined,
  numberOfShares: undefined,
  underlying: undefined,
  price: undefined,
  purchasePrice: undefined,
  ...props.initialAccountData,
});

const institutionFormData = ref<InstitutionFormData>({
  name: '',
  parentId: 0,
  institutionType: null,
  ...props.initialInstitutionData,
});

const validationError = ref('');

const modalTitle = computed(() => {
  if (props.resourceType === 'institution') {
    return props.type === 'create' ? 'Create Institution' : 'Edit Institution';
  }
  return props.type === 'create' ? 'Create Account' : 'Edit Account';
});

const emitClose = (): void => emit('close');

const handleSave = (): void => {
  validationError.value = '';

  if (props.resourceType === 'institution') {
    const error = validateInstitutionForm(institutionFormData.value as any);
    if (error) {
      validationError.value = error;
      return;
    }
    emit('save', {
      name: institutionFormData.value.name,
      institutionId: 0,
      parentId: institutionFormData.value.parentId || null,
      institutionType: institutionFormData.value.institutionType || null,
    });
  } else {
    const error = validateAccountForm(formData.value, props.type === 'create');
    if (error) {
      validationError.value = error;
      return;
    }
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
    });
  }
};
</script>
