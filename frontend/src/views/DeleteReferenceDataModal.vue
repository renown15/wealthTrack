<template>
  <BaseModal :open="open" title="Confirm Delete" @close="$emit('cancel')">
    <template #default>
      <p class="mb-4">Delete this reference data entry?</p>
      <p class="text-sm text-gray-600">
        <strong>Class Key:</strong> {{ item?.classKey }}<br />
        <strong>Value:</strong> {{ item?.referenceValue }}
      </p>
    </template>
    <template #footer>
      <button class="btn-modal-secondary" @click="$emit('cancel')">Cancel</button>
      <button
        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
        @click="$emit('confirm')"
        :disabled="isDeleting"
      >
        {{ isDeleting ? 'Deleting...' : 'Delete' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from '@components/BaseModal.vue';
import type { ReferenceDataItem } from '@/models/ReferenceData';

interface Props {
  open: boolean;
  item: (ReferenceDataItem & { updatedAt: string }) | null;
  isDeleting: boolean;
}

defineProps<Props>();
defineEmits<{
  cancel: [];
  confirm: [];
}>();
</script>
