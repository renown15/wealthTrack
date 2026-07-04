<template>
  <BaseModal :open="open" title="Unique Taxpayer Reference" size="small" @close="emit('close')">
    <div class="form-field">
      <label class="form-label">UTR</label>
      <input
        v-model="value"
        class="form-input"
        type="text"
        maxlength="20"
        placeholder="e.g. 1234567890"
      />
      <p class="text-xs text-muted mt-1">Your 10-digit Unique Taxpayer Reference, stored against your profile.</p>
    </div>

    <template #footer>
      <button class="btn-modal-secondary" @click="emit('close')">Cancel</button>
      <button class="btn-primary" @click="emit('save', value.trim() || null)">Save</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import BaseModal from '@/components/BaseModal.vue';

const props = defineProps<{ open: boolean; utr: string | null }>();
const emit = defineEmits<{ close: []; save: [utr: string | null] }>();

const value = ref('');
watch(() => props.open, (isOpen) => {
  if (isOpen) value.value = props.utr ?? '';
}, { immediate: true });
</script>
