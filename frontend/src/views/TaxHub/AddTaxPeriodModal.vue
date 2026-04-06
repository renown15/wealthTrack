<template>
  <BaseModal :open="open" title="Add Tax Period" size="small" @close="emit('close')">
    <template #default>
      <div v-if="validationError" class="error-banner mb-4">{{ validationError }}</div>

      <div class="form-field">
        <label class="form-label">Name</label>
        <input v-model="form.name" class="form-input" placeholder="e.g. 2023/24" />
      </div>
      <div class="form-field">
        <label class="form-label">Start Date</label>
        <input v-model="form.startDate" class="form-input" type="date" />
      </div>
      <div class="form-field">
        <label class="form-label">End Date</label>
        <input v-model="form.endDate" class="form-input" type="date" />
      </div>
    </template>

    <template #footer>
      <button class="btn-modal-secondary" @click="emit('close')">Cancel</button>
      <button class="btn-primary" @click="handleSave">Save</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { TaxPeriodCreateRequest } from '@models/TaxModels';
import BaseModal from '@/components/BaseModal.vue';

const DEFAULT_YEAR = new Date().getFullYear();

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{
  close: [];
  save: [data: TaxPeriodCreateRequest];
}>();

const form = ref({
  name: `${DEFAULT_YEAR - 1}/${String(DEFAULT_YEAR).slice(-2)}`,
  startDate: `${DEFAULT_YEAR - 1}-04-06`,
  endDate: `${DEFAULT_YEAR}-04-05`,
});
const validationError = ref<string | null>(null);

watch(() => props.open, (val) => {
  if (val) validationError.value = null;
});

function handleSave(): void {
  validationError.value = null;
  if (!form.value.name.trim()) {
    validationError.value = 'Name is required';
    return;
  }
  if (!form.value.startDate || !form.value.endDate) {
    validationError.value = 'Start and end dates are required';
    return;
  }
  if (form.value.endDate <= form.value.startDate) {
    validationError.value = 'End date must be after start date';
    return;
  }
  emit('save', {
    name: form.value.name.trim(),
    startDate: form.value.startDate,
    endDate: form.value.endDate,
  });
}
</script>
