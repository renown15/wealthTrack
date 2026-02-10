<template>
  <BaseModal
    :open="open"
    :title="modalTitle"
    size="large"
    @close="handleClose"
  >
    <template #default>
      <div v-if="error" class="credential-error">{{ error }}</div>
      <div v-if="loading" class="credential-loading">
        <p>Loading credentials...</p>
      </div>

      <div v-else>
        <section class="credential-list">
          <h3>Existing credentials</h3>
          <ul>
            <li
              v-for="credential in credentials"
              :key="credential.id"
              class="credential-item"
            >
              <div>
                <p class="credential-type">{{ credential.typeLabel }}</p>
                <p class="credential-key">{{ credential.key || 'No key stored' }}</p>
                <p class="credential-updated">
                  Updated {{ formatDate(credential.updatedAt) }}
                </p>
              </div>
              <div class="credential-actions">
                <button class="btn btn-secondary" type="button" @click="startEdit(credential)">
                  Edit
                </button>
                <button
                  class="btn btn-danger"
                  type="button"
                  @click="deleteCredential(credential.id)"
                  :disabled="deletingId === credential.id"
                >
                  {{ deletingId === credential.id ? 'Deleting…' : 'Delete' }}
                </button>
              </div>
            </li>
            <li v-if="!credentials.length" class="credential-empty">
              No credentials stored yet for this institution.
            </li>
          </ul>
        </section>

        <section class="credential-form">
          <h3>{{ isEditing ? 'Update credential' : 'Add credential' }}</h3>
          <div class="form-group">
            <label for="credential-type">Credential type</label>
            <select id="credential-type" v-model.number="formData.typeId">
              <option value="">Select credential type</option>
              <option
                v-for="type in credentialTypes"
                :key="type.id"
                :value="type.id"
              >
                {{ type.referenceValue }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="credential-key">Key</label>
            <input
              id="credential-key"
              type="text"
              v-model="formData.key"
            />
          </div>

          <div class="form-group">
            <label for="credential-value">Value</label>
            <input
              id="credential-value"
              type="text"
              v-model="formData.value"
            />
          </div>
        </section>
      </div>
    </template>

    <template #footer>
      <button class="btn btn-secondary" type="button" @click="handleClose">Close</button>
      <button
        class="btn btn-primary"
        type="button"
        :disabled="!canSubmit || saving"
        @click="handleSave"
      >
        {{ saving ? (isEditing ? 'Saving…' : 'Adding…') : isEditing ? 'Save credential' : 'Add credential' }}
      </button>
      <button
        v-if="isEditing"
        class="btn"
        type="button"
        @click="cancelEdit"
      >
        Cancel edit
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Institution } from '@/models/Portfolio';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import type { InstitutionCredential } from '@/models/InstitutionCredential';
import BaseModal from '@/components/BaseModal.vue';

interface FormState {
  typeId: number;
  key: string;
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

const canSubmit = computed(
  () => !!formData.value.typeId && !!formData.value.key && !!formData.value.value,
);

const handleClose = (): void => {
  emit('close');
};

const handleSave = (): void => {
  if (!canSubmit.value) {
    return;
  }
  emit('save', { ...formData.value });
};

const startEdit = (credential: InstitutionCredential): void => {
  emit('edit', credential);
};

const cancelEdit = (): void => {
  emit('cancelEdit');
};

const deleteCredential = (credentialId: number): void => {
  emit('remove', credentialId);
};

const resetForm = (): void => {
  formData.value = {
    typeId: props.credentialTypes[0]?.id ?? 0,
    key: '',
    value: '',
  };
};

watch(
  () => props.open,
  (open) => {
    if (open && !isEditing.value) {
      resetForm();
    }
  },
);

watch(
  () => props.credentialTypes,
  (types) => {
    if (types.length && formData.value.typeId === 0) {
      formData.value.typeId = types[0].id;
    }
  },
  { deep: true },
);

watch(
  () => props.editingCredential,
  (credential) => {
    if (credential) {
      formData.value = {
        typeId: credential.typeId,
        key: credential.key || '',
        value: credential.value || '',
      };
    } else {
      resetForm();
    }
  },
);

const formatDate = (value: string): string =>
  new Date(value).toLocaleString();
</script>

<style scoped>
.credential-list {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  background: #fafafa;
}

.credential-list h3 {
  margin: 0 0 1rem 0;
}

.credential-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.credential-item:last-child {
  border-bottom: none;
}

.credential-actions {
  display: flex;
  gap: 0.5rem;
}

.credential-type {
  margin: 0;
  font-weight: 600;
}

.credential-key {
  margin: 0.25rem 0;
  color: #4a5568;
}

.credential-updated {
  margin: 0;
  font-size: 0.85rem;
  color: #a0aec0;
}

.credential-empty {
  padding: 1rem 0;
  color: #718096;
}

.credential-form h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.credential-error {
  background: #fed7d7;
  border-left: 4px solid #f56565;
  color: #c53030;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.credential-loading {
  padding: 1rem;
  text-align: center;
}
</style>
