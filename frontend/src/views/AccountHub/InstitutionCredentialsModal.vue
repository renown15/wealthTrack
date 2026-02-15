<template>
  <BaseModal :open="open" :title="modalTitle" size="large" @close="handleClose">
    <template #default>
      <div v-if="error" class="error-banner mb-4">{{ error }}</div>
      <div v-if="loading" class="p-4 text-center text-muted">
        <p>Loading credentials...</p>
      </div>
      <div v-else>
        <ExistingCredentialsList
          :credentials="credentials"
          :deleting-id="deletingId"
          @edit="startEdit"
          @remove="deleteCredential"
        />
        <section class="border border-border rounded-xl p-6 bg-white">
          <h3 class="mt-0 mb-4 font-semibold text-text-dark">
            {{ isEditing ? 'Update credential' : 'Add credential' }}
          </h3>
          <div class="form-group">
            <label for="credential-type" class="form-label">Credential type</label>
            <select id="credential-type" v-model.number="formData.typeId" class="form-select">
              <option :value="0">Select credential type</option>
              <option v-for="type in credentialTypes" :key="type.id" :value="type.id">
                {{ type.referenceValue }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="credential-key" class="form-label">Additional Details</label>
            <input
              id="credential-key"
              v-model="formData.key"
              type="text"
              class="form-input"
              placeholder="Optional details (e.g., security question, mother's maiden name)"
            />
          </div>
          <div class="form-group">
            <label for="credential-value" class="form-label">Value</label>
            <input
              id="credential-value"
              v-model="formData.value"
              type="text"
              class="form-input"
            />
          </div>
        </section>
      </div>
    </template>
    <template #footer>
      <button class="btn-modal-secondary" type="button" @click="handleClose">Close</button>
      <button
        class="btn-primary"
        type="button"
        :disabled="!canSubmit || saving"
        @click="handleSave"
      >
        {{ saving ? (isEditing ? 'Saving…' : 'Adding…') : isEditing ? 'Save credential' : 'Add credential' }}
      </button>
      <button v-if="isEditing" class="btn-modal-secondary" type="button" @click="cancelEdit">
        Cancel edit
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Institution } from '@/models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import type { InstitutionCredential } from '@/models/InstitutionCredential';
import BaseModal from '@/components/BaseModal.vue';
import ExistingCredentialsList from '@views/AccountHub/ExistingCredentialsList.vue';

interface FormState {
  typeId: number;
  key?: string;
  value: string;
}

const props = defineProps<{
  open: boolean;
  institution: Institution | null;
  credentialTypes: ReferenceDataItem[];
  credentials: InstitutionCredential[];
  loading: boolean;
  saving: boolean;
  deletingId: number | null;
  error?: string | null;
  editingCredential: InstitutionCredential | null;
}>();

const emit = defineEmits<{
  close: [];
  save: [FormState];
  edit: [InstitutionCredential];
  cancelEdit: [];
  remove: [number];
}>();

const formData = ref<FormState>({ typeId: 0, key: '', value: '' });
const isEditing = computed(() => Boolean(props.editingCredential));
const modalTitle = computed(() =>
  props.institution ? `Credentials · ${props.institution.name}` : 'Manage credentials',
);
const canSubmit = computed(() => !!formData.value.typeId && !!formData.value.value);

const handleClose = (): void => emit('close');
const handleSave = (): void => {
  if (!canSubmit.value) return;
  emit('save', { ...formData.value });
};
const startEdit = (credential: InstitutionCredential): void => emit('edit', credential);
const cancelEdit = (): void => emit('cancelEdit');
const deleteCredential = (credentialId: number): void => emit('remove', credentialId);

const resetForm = (): void => {
  const firstTypeId = props.credentialTypes.length > 0 ? props.credentialTypes[0].id : 0;
  formData.value = { typeId: firstTypeId, key: '', value: '' };
};

watch(
  () => props.open,
  (open) => {
    if (open && !isEditing.value) resetForm();
  },
);

watch(
  () => props.credentialTypes,
  (types) => {
    if (types?.length && formData.value.typeId === 0) {
      formData.value.typeId = types[0].id;
    }
  },
  { deep: true },
);

watch(
  () => props.editingCredential,
  (credential) => {
    if (credential) {
      formData.value = { typeId: credential.typeId, key: credential.key || '', value: credential.value || '' };
    } else {
      resetForm();
    }
  },
);

watch(
  () => formData.value.typeId,
  () => {
    // Clear key and value when credential type changes
    if (!isEditing.value) {
      formData.value.key = '';
      formData.value.value = '';
    }
  },
);
</script>
