<template>
  <div>
    <hr class="my-4 border-gray-200">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
      <h3 class="section-title">Providers</h3>
    </div>

    <div v-if="providers.length === 0" class="text-muted text-sm py-2">
      <span v-if="readOnly">No providers.</span>
      <span v-else>No providers yet. Use <strong>+ Add Provider</strong> (top right) to add one.</span>
    </div>
    <div v-else class="overflow-x-auto border border-gray-200 rounded-lg">
      <table class="w-full">
        <thead class="border-b-2 border-gray-200 bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Provider</th>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Parent</th>
            <th v-if="!readOnly" class="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in providers" :key="p.id" class="border-b border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-2 text-sm font-medium text-gray-900">{{ p.name }}</td>
            <td class="px-4 py-2 text-sm text-gray-500">{{ p.institutionType ?? '—' }}</td>
            <td class="px-4 py-2 text-sm text-gray-500">{{ parentName(p.parentId) }}</td>
            <td v-if="!readOnly" class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <button class="btn-icon edit inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200" title="Edit" @click="openEdit(p)">{{ Icons.edit }}</button>
                <button class="btn-icon delete inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200" title="Delete" @click="confirmDelete(p)">{{ Icons.delete }}</button>
                <button class="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200" type="button" @click="openCredentialsModal(p)">Creds</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <InstitutionModal
      :open="modalOpen"
      :type="modalType"
      :institutions="providers"
      :institution-types="institutionTypes"
      :initial-name="editing?.name"
      :initial-parent-id="editing?.parentId ?? undefined"
      :initial-institution-type="editing?.institutionType ?? undefined"
      :error="modalError"
      @close="modalOpen = false"
      @save="handleSave"
    />

    <InstitutionCredentialsModal
      :open="credentialModalOpen"
      :institution="credentialInstitution"
      :credential-types="credentialTypes"
      :credentials="credentials"
      :loading="credentialLoading"
      :saving="credentialSaving"
      :deleting-id="credentialDeletingId"
      :error="credentialError"
      :editing-credential="editingCredential"
      @close="closeCredentialsModal"
      @save="handleCredentialSave"
      @edit="handleCredentialEdit"
      @cancel-edit="cancelCredentialEdit"
      @remove="handleCredentialDelete"
    />

    <DeleteConfirmModal
      :open="deleteOpen"
      :item-name="deleteName"
      @close="deleteOpen = false"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Institution } from '@models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@models/ReferenceData';
import { apiService } from '@services/ApiService';
import { useCredentialsModal } from '@composables/useCredentialsModal';
import { useToast } from '@composables/useToast';
import { Icons } from '@/constants/icons';
import InstitutionModal from '@views/AccountHub/InstitutionModal.vue';
import InstitutionCredentialsModal from '@views/AccountHub/InstitutionCredentialsModal.vue';
import DeleteConfirmModal from '@views/AccountHub/DeleteConfirmModal.vue';

interface ProviderPayload {
  name: string;
  parentId?: number | null;
  institutionType?: string | null;
}

const props = defineProps<{
  providers: Institution[];
  institutionTypes: ReferenceDataItem[];
  credentialTypes: ReferenceDataItem[];
  readOnly?: boolean;
}>();

const emit = defineEmits<{ changed: [] }>();

const { showSuccess, showError } = useToast();
const {
  credentialModalOpen, credentialInstitution, credentials, credentialLoading, credentialSaving,
  credentialDeletingId, credentialError, editingCredential, openCredentialsModal,
  closeCredentialsModal, handleCredentialSave, handleCredentialEdit, cancelCredentialEdit,
  handleCredentialDelete,
} = useCredentialsModal();

const modalOpen = ref(false);
const modalType = ref<'create' | 'edit'>('create');
const editing = ref<Institution | null>(null);
const modalError = ref<string | null>(null);
const deleteOpen = ref(false);
const deleteName = ref('');
const deletingId = ref(0);

function parentName(parentId?: number | null): string {
  if (!parentId) return '—';
  return props.providers.find((p) => p.id === parentId)?.name ?? '—';
}

function openCreate(): void {
  modalType.value = 'create';
  editing.value = null;
  modalError.value = null;
  modalOpen.value = true;
}

function openEdit(provider: Institution): void {
  modalType.value = 'edit';
  editing.value = provider;
  modalError.value = null;
  modalOpen.value = true;
}

async function handleSave(payload: ProviderPayload): Promise<void> {
  const data = {
    name: payload.name,
    parentId: payload.parentId ?? null,
    institutionType: payload.institutionType ?? null,
  };
  try {
    if (modalType.value === 'edit' && editing.value) {
      await apiService.updateInstitution(editing.value.id, data);
    } else {
      await apiService.createInstitution(data);
    }
    modalOpen.value = false;
    showSuccess(modalType.value === 'edit' ? 'Provider updated' : 'Provider added');
    emit('changed');
  } catch (e) {
    modalError.value = e instanceof Error ? e.message : 'Failed to save provider';
  }
}

function confirmDelete(provider: Institution): void {
  deletingId.value = provider.id;
  deleteName.value = provider.name;
  deleteOpen.value = true;
}

async function handleDelete(): Promise<void> {
  deleteOpen.value = false;
  try {
    await apiService.deleteInstitution(deletingId.value);
    showSuccess('Provider deleted');
    emit('changed');
  } catch (e) {
    showError(e instanceof Error ? e.message : 'Failed to delete provider');
  }
}

defineExpose({ openCreate });
</script>
