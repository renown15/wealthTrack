<template>
  <div class="mt-6 border-t border-border pt-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-text-dark">Documents</h3>
      <label class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded cursor-pointer hover:bg-blue-600 transition-colors">
        <span>{{ uploading ? 'Uploading…' : '+ Upload' }}</span>
        <input
          ref="fileInput"
          type="file"
          accept="image/*,.pdf"
          class="sr-only"
          :disabled="uploading"
          @change="onFileChange"
        />
      </label>
    </div>

    <div v-if="error" class="error-banner mb-3">
      <span>{{ error }}</span>
      <button class="btn-close" @click="error = null">×</button>
    </div>

    <div v-if="loading" class="flex items-center gap-2 text-sm text-muted py-2">
      <div class="spinner-sm"></div><span>Loading documents…</span>
    </div>

    <div v-else-if="documents.length === 0" class="text-sm text-muted py-2">
      No documents uploaded yet.
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="doc in documents"
        :key="doc.id"
        class="flex items-center justify-between gap-3 py-2 px-3 rounded bg-gray-50 border border-border"
      >
        <span class="text-sm text-text-dark truncate flex-1" :title="doc.filename">{{ doc.filename }}</span>
        <span class="text-xs text-muted flex-shrink-0">{{ formatDate(doc.createdAt) }}</span>
        <div class="flex gap-1 flex-shrink-0">
          <button
            class="inline-flex items-center justify-center w-7 h-7 text-xs rounded bg-blue-100 text-blue-600 hover:bg-blue-200 border-none cursor-pointer"
            title="Download"
            @click="downloadDoc(doc)"
          >↓</button>
          <button
            class="inline-flex items-center justify-center w-7 h-7 text-xs rounded bg-red-100 text-red-600 hover:bg-red-200 border-none cursor-pointer"
            title="Delete"
            :disabled="deletingId === doc.id"
            @click="deleteDoc(doc.id)"
          >×</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { AccountDocument } from '@/models/WealthTrackDataModels';
import { accountDocumentService } from '@/services/AccountDocumentService';
import { compressFile } from '@/utils/imageCompression';
import { debug } from '@/utils/debug';

const props = defineProps<{ accountId: number }>();

const documents = ref<AccountDocument[]>([]);
const loading = ref(false);
const uploading = ref(false);
const deletingId = ref<number | null>(null);
const error = ref<string | null>(null);

async function loadDocuments(): Promise<void> {
  if (!props.accountId) return;
  loading.value = true;
  error.value = null;
  try {
    documents.value = await accountDocumentService.listDocuments(props.accountId);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load documents';
  } finally {
    loading.value = false;
  }
}

async function onFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  input.value = '';
  uploading.value = true;
  error.value = null;
  try {
    const compressed = await compressFile(file);
    const doc = await accountDocumentService.uploadDocument(props.accountId, compressed);
    documents.value.push(doc);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Upload failed';
    debug.error('[AccountDocumentsSection] Upload failed', e);
  } finally {
    uploading.value = false;
  }
}

async function downloadDoc(doc: AccountDocument): Promise<void> {
  try {
    const blob = await accountDocumentService.downloadDocument(doc.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = doc.filename; a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Download failed';
  }
}

async function deleteDoc(docId: number): Promise<void> {
  deletingId.value = docId;
  try {
    await accountDocumentService.deleteDocument(docId);
    documents.value = documents.value.filter(d => d.id !== docId);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Delete failed';
  } finally {
    deletingId.value = null;
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

onMounted(loadDocuments);
watch(() => props.accountId, loadDocuments);
</script>
