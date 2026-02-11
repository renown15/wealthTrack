<template>
  <BaseModal
    :open="open"
    :title="modalTitle"
    size="large"
    @close="handleClose"
  >
    <template #default>
      <div v-if="error" class="error-banner mb-4">{{ error }}</div>
      <div v-if="loading" class="p-4 text-center text-muted">
        <p>Loading credentials...</p>
      </div>

      <div v-else>
        <section class="border border-border rounded-xl p-6 mb-6 bg-gray-50">
          <h3 class="m-0 mb-4 font-semibold text-text-dark">Existing credentials</h3>
          <ul class="list-none p-0 m-0">
            <li
              v-for="credential in credentials"
              :key="credential.id"
              class="flex justify-between items-start py-3 border-b border-border last:border-b-0"
            >
              <div>
                <p class="m-0 font-semibold text-text-dark">{{ credential.typeLabel }}</p>
                <p class="m-0 text-sm text-gray-400">
                  Updated {{ formatDate(credential.updatedAt) }}
                </p>
              </div>
              <div class="flex gap-2">
                <button class="btn-secondary text-xs py-1.5 px-3" type="button" @click="startEdit(credential)">
                  Edit
                </button>
                <button
                  class="btn-danger text-xs py-1.5 px-3"
                  type="button"
                  @click="deleteCredential(credential.id)"
                  :disabled="deletingId === credential.id"
                >
                  {{ deletingId === credential.id ? 'Deleting…' : 'Delete' }}
                </button>
              </div>
            </li>
            <li v-if="!credentials.length" class="py-4 text-muted">
              No credentials stored yet for this institution.
            </li>
          </ul>
        </section>

        <section class="border border-border rounded-xl p-6 bg-white">
          <h3 class="mt-0 mb-4 font-semibold text-text-dark">{{ isEditing ? 'Update credential' : 'Add credential' }}</h3>
          <div class="form-group">
            <label for="credential-type" class="form-label">Credential type</label>
            <select id="credential-type" v-model.number="formData.typeId" class="form-select">
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
            <label for="credential-value" class="form-label">Value</label>
            <input
              id="credential-value"
              type="text"
              class="form-input"
              v-model="formData.value"
            />
          </div>
        </section>
      </div>
    </template>

    <template #footer>
      <button class="btn-secondary" type="button" @click="handleClose">Close</button>
      <button
        class="btn-primary"
        type="button"
        :disabled="!canSubmit || saving"
        @click="handleSave"
      >
        {{ saving ? (isEditing ? 'Saving…' : 'Adding…') : isEditing ? 'Save credential' : 'Add credential' }}
      </button>
      <button
        v-if="isEditing"
        class="btn-secondary"
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

const formData = ref<FormState>({ typeId: 0, value: '' });

const isEditing = computed(() => Boolean(props.editingCredential));

const modalTitle = computed(() =>
  props.institution ? `Credentials · ${props.institution.name}` : 'Manage credentials',
);

const canSubmit = computed(
  () => !!formData.value.typeId && !!formData.value.value,
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
      formData.value = {
        typeId: credential.typeId,
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

<!-- Uses UnoCSS utilities via shortcuts -->
