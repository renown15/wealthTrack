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
          v-model="formData.name"
          type="text"
          class="form-input"
          :placeholder="
            resourceType === 'account'
              ? 'e.g., Checking, Savings'
              : 'e.g., Chase Bank, Wells Fargo'
          "
        />
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
    </template>

    <template #footer>
      <button class="btn-secondary" @click="emitClose">Cancel</button>
      <button class="btn-primary" @click="handleSave">
        {{ type === 'create' ? 'Create' : 'Save' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue';
import type { Institution } from '@/models/Portfolio';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import BaseModal from '@/components/BaseModal.vue';
import { useAccountForm, type AccountFormProps } from '@/composables/useAccountForm';

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
}

interface SavePayload {
  name: string;
  institutionId: number;
  typeId?: number;
  statusId?: number;
  openedAt?: string;
  closedAt?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: []; save: [SavePayload] }>();

const formProps = computed<AccountFormProps>(() => ({
  open: props.open,
  resourceType: props.resourceType,
  initialName: props.initialName,
  initialInstitutionId: props.initialInstitutionId,
  initialTypeId: props.initialTypeId,
  initialStatusId: props.initialStatusId,
  initialOpenedAt: props.initialOpenedAt,
  initialClosedAt: props.initialClosedAt,
  accountTypes: props.accountTypes,
  accountStatuses: props.accountStatuses,
}));

const { formData } = useAccountForm(toRef(formProps));

const modalTitle = computed(() => {
  const verb = props.type === 'create' ? 'New' : 'Edit';
  const label = props.resourceType === 'account' ? 'Account' : 'Institution';
  return `${verb} ${label}`;
});

const emitClose = (): void => emit('close');

const handleSave = (): void => {
  if (!formData.value.name) return;
  if (props.resourceType === 'account') {
    if (props.type === 'create' && !formData.value.institutionId) return;
    if (!formData.value.typeId || !formData.value.statusId) return;
  }

  const payload: SavePayload = {
    name: formData.value.name,
    institutionId: formData.value.institutionId,
  };

  if (props.resourceType === 'account') {
    payload.typeId = formData.value.typeId;
    payload.statusId = formData.value.statusId;
    payload.openedAt = formData.value.openedAt || undefined;
    payload.closedAt = formData.value.closedAt || undefined;
  }

  emit('save', payload);
};
</script>

<!-- Uses UnoCSS utilities via shortcuts -->
