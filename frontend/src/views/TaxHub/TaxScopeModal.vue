<template>
  <BaseModal
    :open="open"
    :title="`${account?.accountName ?? ''} — Mark Out of Scope`"
    size="small"
    @close="emit('close')"
  >
    <template #default>
      <p class="text-sm text-muted mb-4">
        This account will move to <strong>Not in Scope</strong> and the note below will appear in the
        tax briefing extract as the reason for exclusion.
      </p>
      <div class="form-field">
        <label class="form-label">Reason / note</label>
        <textarea
          v-model="note"
          class="form-input"
          rows="3"
          maxlength="500"
          placeholder="e.g. Interest below reporting threshold"
        ></textarea>
      </div>
    </template>

    <template #footer>
      <button class="btn-modal-secondary" @click="emit('close')">Cancel</button>
      <button class="btn-primary" @click="handleSave">Mark Out of Scope</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { EligibleAccount } from '@models/TaxModels';
import BaseModal from '@/components/BaseModal.vue';

const props = defineProps<{ open: boolean; account: EligibleAccount | null }>();
const emit = defineEmits<{
  close: [];
  save: [note: string];
}>();

const note = ref('');

watch(() => props.account, (acct) => {
  note.value = acct?.taxReturn?.note ?? '';
}, { immediate: true });

function handleSave(): void {
  emit('save', note.value.trim());
}
</script>
