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
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="text-left py-1 pr-2 font-medium text-gray-600">Filename</th>
              <th class="text-left py-1 pr-2 font-medium text-gray-600">Uploaded</th>
              <th class="py-1"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in documents" :key="doc.id" class="border-b last:border-0">
              <td class="py-2 pr-2 truncate max-w-xs" :title="doc.filename">{{ doc.filename }}</td>
              <td class="py-2 pr-2 text-muted">{{ formatDate(doc.createdAt) }}</td>
              <td class="py-2">
                <div class="flex gap-1">
                  <button
                    class="btn-icon inline-flex items-center justify-center w-7 h-7 text-xs rounded border-none cursor-pointer bg-gray-100 text-gray-600 hover:bg-gray-200"
                    title="View"
                    @click="emit('preview', doc.id, doc.filename, doc.contentType)"
                  >{{ Icons.eye }}</button>
                  <button
                    class="btn-icon inline-flex items-center justify-center w-7 h-7 text-xs rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                    title="Download"
                    @click="emit('download', doc.id, doc.filename)"
                  >{{ Icons.download }}</button>
                  <button
                    class="btn-icon delete inline-flex items-center justify-center w-7 h-7 text-xs rounded border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
                    title="Delete"
                    @click="emit('deleteDoc', doc.id)"
                  >{{ Icons.delete }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-muted text-sm mb-4">No documents uploaded yet.</div>

      <div class="form-field">
        <label class="form-label">Upload New Document</label>
        <input ref="fileInput" type="file" class="form-input" @change="handleFileChange" />
      </div>
    </template>

    <template #footer>
      <button class="btn-modal-secondary" @click="emit('close')">Close</button>
      <button class="btn-primary" :disabled="!selectedFile" @click="handleUpload">
        {{ Icons.upload }} Upload
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { EligibleAccount, TaxDocument } from '@models/TaxModels';
import BaseModal from '@/components/BaseModal.vue';
import { Icons } from '@/constants/icons';

const props = defineProps<{
  open: boolean;
  account: EligibleAccount | null;
}>();

const emit = defineEmits<{
  close: [];
  upload: [file: File];
  download: [docId: number, filename: string];
  preview: [docId: number, filename: string, contentType: string | null];
  deleteDoc: [docId: number];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);

const documents = computed<TaxDocument[]>(() => props.account?.documents ?? []);

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB');
}

function handleFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  selectedFile.value = input.files?.[0] ?? null;
}

function handleUpload(): void {
  if (selectedFile.value) {
    emit('upload', selectedFile.value);
    selectedFile.value = null;
    if (fileInput.value) fileInput.value.value = '';
  }
}
</script>
