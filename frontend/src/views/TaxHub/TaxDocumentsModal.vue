<template>
  <BaseModal
    :open="open"
    :title="`${account?.accountName ?? ''} — Documents`"
    size="medium"
    @close="emit('close')"
  >
    <template #default>
      <p class="text-sm text-muted mb-4">
        {{ account?.accountType }}
        <span v-if="account?.institutionName"> · {{ account.institutionName }}</span>
      </p>

      <div v-if="documents.length > 0" class="mb-4">
        <TaxDocumentsTable
          :documents="documents"
          @preview="(id, name, type) => emit('preview', id, name, type)"
          @download="(id, name) => emit('download', id, name)"
          @delete-doc="(id) => emit('deleteDoc', id)"
          @update-description="(id, desc) => emit('updateDescription', id, desc)"
        />
      </div>

      <div v-else class="text-muted text-sm mb-4">No documents uploaded yet.</div>

      <DocumentUploadPanel @upload="(file, desc) => emit('upload', file, desc)" />
    </template>

    <template #footer>
      <button class="btn-modal-secondary" @click="emit('close')">Close</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { EligibleAccount, TaxDocument } from '@models/TaxModels';
import BaseModal from '@/components/BaseModal.vue';
import DocumentUploadPanel from '@views/TaxHub/DocumentUploadPanel.vue';
import TaxDocumentsTable from '@views/TaxHub/TaxDocumentsTable.vue';

const props = defineProps<{
  open: boolean;
  account: EligibleAccount | null;
}>();

const emit = defineEmits<{
  close: [];
  upload: [file: File, description?: string];
  updateDescription: [docId: number, description: string | null];
  download: [docId: number, filename: string];
  preview: [docId: number, filename: string, contentType: string | null];
  deleteDoc: [docId: number];
}>();

const documents = computed<TaxDocument[]>(() => props.account?.documents ?? []);
</script>
