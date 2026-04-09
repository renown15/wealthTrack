<template>
  <BaseModal :open="open" :title="`${accountName} — Documents`" size="medium" @close="emit('close')">
    <template #default>
      <div v-if="error" class="error-banner mb-3">
        <span>{{ error }}</span><button class="btn-close" @click="error = null">×</button>
      </div>

      <div v-if="loading" class="flex items-center gap-2 text-sm text-muted py-2">
        <div class="spinner-sm"></div><span>Loading…</span>
      </div>

      <div v-else-if="documents.length === 0" class="text-muted text-sm mb-4">
        No documents uploaded yet.
      </div>

      <table v-else class="w-full text-sm mb-4">
        <thead>
          <tr class="border-b">
            <th class="text-left py-1 pr-2 font-medium text-gray-600">Filename</th>
            <th class="text-left py-1 pr-2 font-medium text-gray-600">Description</th>
            <th class="text-left py-1 pr-2 font-medium text-gray-600">Uploaded</th>
            <th class="py-1"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in documents" :key="doc.id" class="border-b last:border-0">
            <td class="py-2 pr-2 truncate max-w-xs" :title="doc.filename">{{ doc.filename }}</td>
            <td class="py-2 pr-2 max-w-xs">
              <div v-if="editingDocId === doc.id" class="flex gap-1 items-center">
                <input v-model="editingDescription" type="text" class="form-input text-xs py-0.5 px-1 h-6" maxlength="500" @keyup.enter="saveDescription(doc.id)" @keyup.escape="editingDocId = null" />
                <button class="btn-icon inline-flex items-center justify-center w-6 h-6 text-xs rounded border-none cursor-pointer bg-green-100 text-green-700 hover:bg-green-200" title="Save" @click="saveDescription(doc.id)">{{ Icons.save }}</button>
                <button class="btn-icon inline-flex items-center justify-center w-6 h-6 text-xs rounded border-none cursor-pointer bg-gray-100 text-gray-600 hover:bg-gray-200" title="Cancel" @click="editingDocId = null">{{ Icons.cancel }}</button>
              </div>
              <span v-else class="text-muted truncate block">{{ doc.description ?? '—' }}</span>
            </td>
            <td class="py-2 pr-2 text-muted">{{ formatDate(doc.createdAt) }}</td>
            <td class="py-2">
              <div class="flex gap-1">
                <button
                  class="btn-icon inline-flex items-center justify-center w-7 h-7 text-xs rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                  title="Download" @click="downloadDoc(doc)"
                >{{ Icons.download }}</button>
                <button
                  class="btn-icon inline-flex items-center justify-center w-7 h-7 text-xs rounded border-none cursor-pointer bg-gray-100 text-gray-500 hover:bg-gray-200"
                  title="Edit description" @click="startEdit(doc)"
                >{{ Icons.edit }}</button>
                <button
                  class="btn-icon delete inline-flex items-center justify-center w-7 h-7 text-xs rounded border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
                  title="Delete" :disabled="deletingId === doc.id" @click="deleteDoc(doc.id)"
                >{{ Icons.delete }}</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="grid grid-cols-2 gap-4 mt-2">
        <div class="form-field">
          <label class="form-label">Upload Document / Image</label>
          <input ref="fileInput" type="file" accept="image/*,.pdf" class="form-input" @change="onFileChange" />
        </div>
        <div class="form-field">
          <label class="form-label">Description <span class="text-muted">(optional)</span></label>
          <input v-model="description" type="text" class="form-input" placeholder="e.g. Annual statement 2025" maxlength="500" />
        </div>
      </div>
    </template>

    <template #footer>
      <button class="btn-modal-secondary" @click="emit('close')">Close</button>
      <button class="btn-primary" :disabled="!selectedFile || uploading" @click="handleUpload">
        {{ uploading ? 'Uploading…' : `${Icons.upload} Upload` }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { AccountDocument } from '@/models/WealthTrackDataModels';
import { accountDocumentService } from '@/services/AccountDocumentService';
import { compressFile } from '@/utils/imageCompression';
import { debug } from '@/utils/debug';
import BaseModal from '@/components/BaseModal.vue';
import { Icons } from '@/constants/icons';

const editingDocId = ref<number | null>(null);
const editingDescription = ref('');

const props = defineProps<{ open: boolean; accountId: number; accountName: string }>();
const emit = defineEmits<{ close: []; uploaded: []; deleted: [] }>();

const documents = ref<AccountDocument[]>([]);
const loading = ref(false);
const uploading = ref(false);
const deletingId = ref<number | null>(null);
const error = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const description = ref('');

async function load(): Promise<void> {
  loading.value = true; error.value = null;
  try { documents.value = await accountDocumentService.listDocuments(props.accountId); }
  catch (e) { error.value = e instanceof Error ? e.message : 'Failed to load documents'; }
  finally { loading.value = false; }
}

function onFileChange(event: Event): void {
  selectedFile.value = (event.target as HTMLInputElement).files?.[0] ?? null;
}

async function handleUpload(): Promise<void> {
  if (!selectedFile.value) return;
  uploading.value = true; error.value = null;
  try {
    const compressed = await compressFile(selectedFile.value);
    const doc = await accountDocumentService.uploadDocument(props.accountId, compressed, description.value || undefined);
    documents.value.push(doc);
    selectedFile.value = null; description.value = '';
    if (fileInput.value) fileInput.value.value = '';
    emit('uploaded');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Upload failed';
    debug.error('[AccountDocumentsModal] Upload failed', e);
  } finally { uploading.value = false; }
}

async function downloadDoc(doc: AccountDocument): Promise<void> {
  try {
    const blob = await accountDocumentService.downloadDocument(doc.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = doc.filename; a.click();
    URL.revokeObjectURL(url);
  } catch (e) { error.value = e instanceof Error ? e.message : 'Download failed'; }
}

function startEdit(doc: AccountDocument): void {
  editingDocId.value = doc.id;
  editingDescription.value = doc.description ?? '';
}

async function saveDescription(docId: number): Promise<void> {
  try {
    const updated = await accountDocumentService.updateDescription(docId, editingDescription.value || null);
    const idx = documents.value.findIndex(d => d.id === docId);
    if (idx !== -1) documents.value[idx] = updated;
    editingDocId.value = null;
  } catch (e) { error.value = e instanceof Error ? e.message : 'Save failed'; }
}

async function deleteDoc(docId: number): Promise<void> {
  deletingId.value = docId;
  try {
    await accountDocumentService.deleteDocument(docId);
    documents.value = documents.value.filter(d => d.id !== docId);
    emit('deleted');
  } catch (e) { error.value = e instanceof Error ? e.message : 'Delete failed'; }
  finally { deletingId.value = null; }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB');
}

watch(() => props.open, (open) => { if (open) void load(); });
</script>
