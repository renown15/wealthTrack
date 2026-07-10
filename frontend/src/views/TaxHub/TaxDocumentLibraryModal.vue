<template>
  <BaseModal :open="open" title="Document Library" size="large" @close="emit('close')">
    <template #default>
      <p class="text-sm text-muted mb-4">
        Every tax document you've uploaded, across all periods and accounts.
      </p>

      <div v-if="error" class="error-banner mb-3"><span>{{ error }}</span></div>
      <div v-if="loading" class="text-muted text-sm">Loading…</div>
      <div v-else-if="documents.length === 0" class="text-muted text-sm mb-4">
        No documents uploaded yet. Upload them from an account's Docs action.
      </div>
      <div v-else class="mb-4">
        <TaxDocumentsTable
          :documents="documents"
          :show-source="true"
          @preview="preview"
          @download="download"
          @delete-doc="removeDocument"
          @update-description="updateDescription"
        />
      </div>
    </template>

    <template #footer>
      <button class="btn-modal-secondary" @click="emit('close')">Close</button>
    </template>
  </BaseModal>

  <DocumentPreviewModal
    :open="previewOpen"
    :url="previewUrl"
    :filename="previewFilename"
    :content-type="previewContentType"
    @close="closePreview"
  />
</template>

<script setup lang="ts">
import { watch } from 'vue';
import BaseModal from '@/components/BaseModal.vue';
import TaxDocumentsTable from '@views/TaxHub/TaxDocumentsTable.vue';
import DocumentPreviewModal from '@views/TaxHub/DocumentPreviewModal.vue';
import { useTaxDocumentLibrary } from '@composables/useTaxDocumentLibrary';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const {
  documents, loading, error,
  previewOpen, previewUrl, previewFilename, previewContentType,
  loadLibrary, download, preview, closePreview, removeDocument, updateDescription,
} = useTaxDocumentLibrary();

watch(() => props.open, (open) => {
  if (open) void loadLibrary();
}, { immediate: true });
</script>
