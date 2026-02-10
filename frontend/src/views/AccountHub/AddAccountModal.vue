<template>
  <BaseModal
    :open="open"
    :title="modalTitle"
    size="medium"
    @close="emitClose"
  >
    <template #default>
      <div class="form-group">
        <label :for="`${resourceType}-name`">
          {{ resourceType === 'account' ? 'Account' : 'Institution' }} Name
        </label>
        <input
          :id="`${resourceType}-name`"
          v-model="formData.name"
          type="text"
          :placeholder="
            resourceType === 'account'
              ? 'e.g., Checking, Savings'
              : 'e.g., Chase Bank, Wells Fargo'
          "
        />
      </div>

      <div v-if="resourceType === 'account' && type === 'create'" class="form-group">
        <label for="institution-select">Institution</label>
        <select v-model.number="formData.institutionId" id="institution-select">
          <option value="">Select Institution</option>
          <option v-for="inst in institutions" :key="inst.id" :value="inst.id">
            {{ inst.name }}
          </option>
        </select>
      </div>

      <div v-if="resourceType === 'account'" class="form-group">
        <label for="accountType">Account Type</label>
        <select id="accountType" v-model.number="formData.typeId">
          <option value="">Select Account Type</option>
          <option v-for="type in accountTypes" :key="type.id" :value="type.id">
            {{ type.referenceValue }}
          </option>
        </select>
      </div>

      <div v-if="resourceType === 'account'" class="form-group">
        <label for="accountStatus">Account Status</label>
        <select id="accountStatus" v-model.number="formData.statusId">
          <option value="">Select Account Status</option>
          <option v-for="status in accountStatuses" :key="status.id" :value="status.id">
            {{ status.referenceValue }}
          </option>
        </select>
      </div>
    </template>

    <template #footer>
      <button class="btn btn-secondary" @click="emitClose">Cancel</button>
      <button class="btn btn-primary" @click="handleSave">
        {{ type === 'create' ? 'Create' : 'Save' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Institution } from '@/models/Portfolio';
import BaseModal from '@/components/BaseModal.vue';
import type { ReferenceDataItem } from '@/models/ReferenceData';

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
}

interface FormData {
  name: string;
  institutionId: number;
  typeId: number;
  statusId: number;
}

interface SavePayload {
  name: string;
  institutionId: number;
  typeId?: number;
  statusId?: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  save: [SavePayload];
}>();

const formData = ref<FormData>({
  name: props.initialName || '',
  institutionId: props.initialInstitutionId || 0,
  typeId: props.initialTypeId || 0,
  statusId: props.initialStatusId || 0,
});

const syncAccountType = (): void => {
  if (props.resourceType !== 'account' || !props.accountTypes.length) {
    return;
  }

  if (
    props.initialTypeId &&
    props.accountTypes.some((type) => type.id === props.initialTypeId)
  ) {
    formData.value.typeId = props.initialTypeId;
    return;
  }

  if (
    formData.value.typeId &&
    props.accountTypes.some((type) => type.id === formData.value.typeId)
  ) {
    return;
  }

  formData.value.typeId = props.accountTypes[0].id;
};

const syncAccountStatus = (): void => {
  if (props.resourceType !== 'account' || !props.accountStatuses.length) {
    return;
  }

  if (
    props.initialStatusId &&
    props.accountStatuses.some((status) => status.id === props.initialStatusId)
  ) {
    formData.value.statusId = props.initialStatusId;
    return;
  }

  if (
    formData.value.statusId &&
    props.accountStatuses.some((status) => status.id === formData.value.statusId)
  ) {
    return;
  }

  formData.value.statusId = props.accountStatuses[0].id;
};

watch(
  () => props.open,
  (newOpen) => {
    if (!newOpen) {
      return;
    }

    formData.value.name = props.initialName || '';
    formData.value.institutionId = props.initialInstitutionId || 0;
    formData.value.typeId = props.initialTypeId || 0;
    formData.value.statusId = props.initialStatusId || 0;
    syncAccountType();
    syncAccountStatus();
  }
);

watch(
  () => props.accountTypes,
  () => {
    if (props.open) {
      syncAccountType();
    }
  },
  { deep: true },
);

watch(
  () => props.accountStatuses,
  () => {
    if (props.open) {
      syncAccountStatus();
    }
  },
  { deep: true },
);

const emitClose = (): void => {
  emit('close');
};

const modalTitle = computed(() => {
  const verb = props.type === 'create' ? 'New' : 'Edit';
  const resourceLabel = props.resourceType === 'account' ? 'Account' : 'Institution';
  return `${verb} ${resourceLabel}`;
});

const handleSave = (): void => {
  if (!formData.value.name) {
    return;
  }

  if (props.resourceType === 'account') {
    if (props.type === 'create' && !formData.value.institutionId) {
      return;
    }
    if (!formData.value.typeId || !formData.value.statusId) {
      return;
    }
  }

  const payload: SavePayload = {
    name: formData.value.name,
    institutionId: formData.value.institutionId,
  };

  if (props.resourceType === 'account') {
    payload.typeId = formData.value.typeId;
    payload.statusId = formData.value.statusId;
  }

  emit('save', payload);
};
</script>

<style scoped src="@/styles/PortfolioView.css"></style>
