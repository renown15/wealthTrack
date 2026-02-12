<template>
  <BaseModal
    :open="open"
    :title="modalTitle"
    size="medium"
    @close="emitClose"
  >
    <template #default>
      <div class="form-group">
        <label :for="`${resourceType}-name`" class="form-label">
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

      <div v-if="resourceType === 'institution'" class="form-group">
        <label for="parentInstitution" class="form-label">Parent Institution (Optional)</label>
        <select v-model.number="institutionFormData.parentId" id="parentInstitution" class="form-select">
          <option :value="0">None</option>
          <option v-for="inst in institutions" :key="inst.id" :value="inst.id">
            {{ inst.name }}
          </option>
        </select>
      </div>

      <div v-if="resourceType === 'account' && type === 'create'" class="form-group">
        <label for="institution-select" class="form-label">Institution</label>
        <select v-model.number="formData.institutionId" id="institution-select" class="form-select">
          <option value="">Select Institution</option>
          <option v-for="inst in institutions" :key="inst.id" :value="inst.id">
            {{ inst.name }}
          </option>
        </select>
      </div>

      <div v-if="resourceType === 'account'" class="form-group">
        <label for="accountType" class="form-label">Account Type</label>
        <select id="accountType" v-model.number="formData.typeId" class="form-select">
          <option value="">Select Account Type</option>
          <option v-for="t in accountTypes" :key="t.id" :value="t.id">
            {{ t.referenceValue }}
          </option>
        </select>
      </div>

      <div v-if="resourceType === 'account'" class="form-group">
        <label for="accountStatus" class="form-label">Account Status</label>
        <select id="accountStatus" v-model.number="formData.statusId" class="form-select">
          <option value="">Select Account Status</option>
          <option v-for="status in accountStatuses" :key="status.id" :value="status.id">
            {{ status.referenceValue }}
          </option>
        </select>
      </div>

      <div v-if="resourceType === 'account'" class="grid grid-cols-2 gap-4">
        <div class="form-group">
          <label for="openedAt" class="form-label">Opened Date</label>
          <input id="openedAt" v-model="formData.openedAt" type="date" class="form-input" />
        </div>
        <div class="form-group">
          <label for="closedAt" class="form-label">Closed Date</label>
          <input id="closedAt" v-model="formData.closedAt" type="date" class="form-input" />
        </div>
      </div>

      <div v-if="resourceType === 'account'" class="form-group">
        <label for="accountNumber" class="form-label">Account Number</label>
        <input id="accountNumber" v-model="formData.accountNumber" type="text" class="form-input" placeholder="e.g., 12345678" />
      </div>

      <div v-if="resourceType === 'account'" class="grid grid-cols-2 gap-4">
        <div class="form-group">
          <label for="sortCode" class="form-label">Sort Code</label>
          <input id="sortCode" v-model="formData.sortCode" type="text" class="form-input" placeholder="e.g., 12-34-56" />
        </div>
        <div class="form-group">
          <label for="rollRefNumber" class="form-label">Roll / Ref Number</label>
          <input id="rollRefNumber" v-model="formData.rollRefNumber" type="text" class="form-input" placeholder="e.g., 123456789" />
        </div>
      </div>

      <div v-if="resourceType === 'account'" class="form-group">
        <label for="interestRate" class="form-label">Interest Rate</label>
        <input id="interestRate" v-model="formData.interestRate" type="text" class="form-input" placeholder="e.g., 2.5%" />
      </div>

      <!-- Fixed/Bonus Rate Fields - Only show for Fixed Rate Saver accounts -->
      <div v-if="isFixedRateSaver" class="form-group">
        <label for="fixedBonusRate" class="form-label">Fixed / Bonus Interest Rate</label>
        <input id="fixedBonusRate" v-model="formData.fixedBonusRate" type="text" class="form-input" placeholder="e.g., 4.5%" />
      </div>
      <div v-if="isFixedRateSaver" class="form-group">
        <label for="fixedBonusRateEndDate" class="form-label">Fixed / Bonus Rate End Date</label>
        <input id="fixedBonusRateEndDate" v-model="formData.fixedBonusRateEndDate" type="date" class="form-input" />
      </div>
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
import { computed, toRef } from 'vue';
import type { Institution } from '@/models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import BaseModal from '@/components/BaseModal.vue';
import { useAccountForm, type AccountFormProps } from '@/composables/useAccountForm';
import { useInstitutionForm, type InstitutionFormProps } from '@/composables/useInstitutionForm';

interface Props {
  open: boolean;
  type: 'create' | 'edit';
  resourceType: 'account' | 'institution';
  institutions: Institution[];
  initialName?: string;
  initialInstitutionId?: number;
  accountTypes: ReferenceDataItem[];
  accountStatuses: ReferenceDataItem[];
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
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: []; save: [SavePayload] }>();

// Check if selected account type is Fixed/Bonus Rate Saver
const isFixedRateSaver = computed(() => {
  if (!props.open || !formData.value.typeId) return false;
  const selectedType = props.accountTypes.find((t) => t.id === formData.value.typeId);
  return selectedType?.referenceValue?.toLowerCase().includes('fixed') || 
         selectedType?.referenceValue?.toLowerCase().includes('bonus');
});

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
  accountTypes: props.accountTypes,
  accountStatuses: props.accountStatuses,
}));

const { formData } = useAccountForm(toRef(formProps));

const institutionFormProps = computed<InstitutionFormProps>(() => ({
  open: props.open,
  initialName: props.initialName,
  initialParentId: props.initialParentId,
}));

const { formData: institutionFormData } = useInstitutionForm(toRef(institutionFormProps));

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
  if (props.resourceType === 'institution') {
    console.log('Institution save - name:', institutionFormData.value.name, 'parentId:', institutionFormData.value.parentId);
    if (!institutionFormData.value.name) {
      console.log('Institution name is empty, returning');
      return;
    }
    const payload: SavePayload = {
      name: institutionFormData.value.name,
      institutionId: 0,
      parentId: institutionFormData.value.parentId || null,
    };
    console.log('Emitting save with payload:', payload);
    emit('save', payload);
  } else {
    if (!formData.value.name) return;
    if (props.type === 'create' && !formData.value.institutionId) return;
    if (!formData.value.typeId || !formData.value.statusId) return;

    const payload: SavePayload = {
      name: formData.value.name,
      institutionId: formData.value.institutionId,
    };

    payload.typeId = formData.value.typeId;
    payload.statusId = formData.value.statusId;
    payload.openedAt = formData.value.openedAt || undefined;
    payload.closedAt = formData.value.closedAt || undefined;
    payload.accountNumber = formData.value.accountNumber || undefined;
    payload.sortCode = formData.value.sortCode || undefined;
    payload.rollRefNumber = formData.value.rollRefNumber || undefined;
    payload.interestRate = formData.value.interestRate || undefined;
    if (isFixedRateSaver.value) {
      payload.fixedBonusRate = formData.value.fixedBonusRate || undefined;
      payload.fixedBonusRateEndDate = formData.value.fixedBonusRateEndDate || undefined;
    }

    emit('save', payload);
  }
};
</script>

<!-- Uses UnoCSS utilities via shortcuts -->
