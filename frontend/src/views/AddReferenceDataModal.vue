<template>
  <BaseModal :open="open" title="Add Reference Data" @close="$emit('close')">
    <template #default>
      <div v-if="error" class="error-banner mb-4">{{ error }}</div>
      <div class="form-group">
        <label for="add-class-key" class="form-label">Class Key *</label>
        <input
          id="add-class-key"
          v-model="form.classKey"
          type="text"
          class="form-input"
          placeholder="e.g., credential_type"
          @keydown.enter="$emit('submit', form)"
        />
      </div>
      <div class="form-group">
        <label for="add-ref-value" class="form-label">Reference Value *</label>
        <input
          id="add-ref-value"
          v-model="form.referenceValue"
          type="text"
          class="form-input"
          placeholder="e.g., API Key"
          @keydown.enter="$emit('submit', form)"
        />
      </div>
      <div class="form-group">
        <label for="add-sort-index" class="form-label">Sort Index (optional)</label>
        <input
          id="add-sort-index"
          v-model.number="form.sortIndex"
          type="number"
          class="form-input"
          min="0"
          placeholder="0"
        />
      </div>
    </template>
    <template #footer>
      <button class="btn-modal-secondary" @click="$emit('close')">Cancel</button>
      <button class="btn-primary" @click="$emit('submit', form)" :disabled="isSubmitting">
        {{ isSubmitting ? 'Creating...' : 'Create' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import BaseModal from '@components/BaseModal.vue';
import type { ReferenceDataPayload } from '@/models/ReferenceData';

interface Props {
  open: boolean;
  isSubmitting: boolean;
  error?: string;
}

interface FormData extends ReferenceDataPayload {
  sortIndex: number | undefined;
}

const props = defineProps<Props>();
defineEmits<{
  close: [];
  submit: [form: FormData];
}>();

const form = ref<FormData>({ classKey: '', referenceValue: '', sortIndex: undefined });

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      form.value = { classKey: '', referenceValue: '', sortIndex: undefined };
    } else {
      form.value.sortIndex = 0;
    }
  },
  { immediate: true },
);
</script>
