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
      <div class="form-group">
        <label
          :for="`${resourceType}-name`"
          class="form-label"
        >
          {{ resourceType === 'account' ? 'Account' : 'Institution' }} Name
        </label>
        <input
          :id="`${resourceType}-name`"
          :value="resourceType === 'institution' ? institutionFormData.name : formData.name"
          @input="(e) => handleNameInput((e.target as HTMLInputElement).value)"
          type="text"
          class="form-input"
          :placeholder="
            resourceType === 'account'
              ? 'e.g., Checking, Savings'
              : 'e.g., Chase Bank, Wells Fargo'
          "
        />
      </div>

      <div
        v-if="resourceType === 'institution'"
        class="form-group"
      >
        <label for="parentInstitution" class="form-label">
          Parent Institution (Optional)
        </label>
        <select
          v-model.number="institutionFormData.parentId"
          id="parentInstitution"
          class="form-select"
        >
          <option :value="0">None</option>
          <option
            v-for="inst in institutions"
            :key="inst.id"
            :value="inst.id"
          >
            {{ inst.name }}
          </option>
        </select>
      </div>

      <div
        v-if="resourceType === 'institution'"
        class="form-group"
      >
        <label for="institutionType" class="form-label">
          Institution Type (Optional)
        </label>
        <select
          v-model="institutionFormData.institutionType"
          id="institutionType"
          class="form-select"
        >
          <option :value="null">Select Type...</option>
          <option
            v-for="type in institutionTypes"
            :key="type.referencevalue"
            :value="type.referencevalue"
          >
            {{ type.referencevalue }}
          </option>
        </select>
      </div>

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
import { computed, toRef, ref } from 'vue';
import type { Institution } from '@/models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import BaseModal from '@/components/BaseModal.vue';
import AccountFormFields from '@views/AccountHub/AccountFormFields.vue';
import { useAccountForm, type AccountFormProps } from '@/composables/useAccountForm';
import {
  useInstitutionForm,
  type InstitutionFormProps,
} from '@/composables/useInstitutionForm';

interface Props {
  open: boolean;
  type: 'create' | 'edit';
  resourceType: 'account' | 'institution';
  institutions: Institution[];
  initialName?: string;
  initialInstitutionId?: number;
  accountTypes: ReferenceDataItem[];
  accountStatuses: ReferenceDataItem[];
  institutionTypes: ReferenceDataItem[];
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
  initialParentId?: number | null;
  initialInstitutionType?: string | null;
}

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
  institutionType?: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: []; save: [SavePayload] }>();

const validationError = ref('');

const formProps = computed<AccountFormProps>(() => ({
  open: props.open,
  resourceType: props.resourceType,
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
  accountTypes: props.accountTypes,
  accountStatuses: props.accountStatuses,
}));

const { formData } = useAccountForm(toRef(formProps));

const institutionFormProps = computed<InstitutionFormProps>(() => ({
  open: props.open,
  initialName: props.initialName,
  initialParentId: props.initialParentId,
  initialInstitutionType: props.initialInstitutionType,
}));

const { formData: institutionFormData } = useInstitutionForm(
  toRef(institutionFormProps)
);

const modalTitle = computed(() => {
  const verb = props.type === 'create' ? 'New' : 'Edit';
  const label = props.resourceType === 'account' ? 'Account' : 'Institution';
  return `${verb} ${label}`;
});

const emitClose = (): void => emit('close');

const handleNameInput = (value: string): void => {
  if (props.resourceType === 'institution') {
    institutionFormData.value.name = value;
  } else {
    formData.value.name = value;
  }
};

const handleSave = (): void => {
  console.log('[AddAccountModal] handleSave called', { resourceType: props.resourceType, formData, type: props.type });
  validationError.value = '';
  
  if (props.resourceType === 'institution') {
    if (!institutionFormData.value.name) {
      validationError.value = 'Please enter a name';
      return;
    }
    emit('save', {
      name: institutionFormData.value.name,
      institutionId: 0,
      parentId: institutionFormData.value.parentId || null,
      institutionType: institutionFormData.value.institutionType || null,
    });
  } else {
    console.log('[AddAccountModal] Account save - checking validations', {
      name: formData.value.name,
      institutionId: formData.value.institutionId,
      typeId: formData.value.typeId,
      statusId: formData.value.statusId,
    });
    if (!formData.value.name) { 
      validationError.value = 'Please enter an account name';
      console.log('[AddAccountModal] Validation failed: no name'); 
      return; 
    }
    if (props.type === 'create' && !formData.value.institutionId) { 
      validationError.value = 'Please select an institution';
      console.log('[AddAccountModal] Validation failed: no institution'); 
      return; 
    }
    if (!formData.value.typeId || !formData.value.statusId) { 
      validationError.value = 'Please select an account type and status';
      console.log('[AddAccountModal] Validation failed: no type or status', { typeId: formData.value.typeId, statusId: formData.value.statusId }); 
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