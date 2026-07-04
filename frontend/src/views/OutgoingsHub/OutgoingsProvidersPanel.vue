<template>
  <div class="hub-content-card p-6">
    <h3 class="header-title text-lg m-0 mb-4">Providers</h3>

    <div v-if="providers.length === 0" class="text-muted text-sm py-2">
      No providers yet. Use <strong>+ Add Provider</strong> (top right) to add one.
    </div>
    <table v-else class="w-full text-sm">
      <thead>
        <tr class="border-b">
          <th class="table-header text-left">Provider</th>
          <th class="table-header text-left">Type</th>
          <th class="table-header text-left">Parent</th>
          <th class="table-header"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in providers" :key="p.id" class="border-b">
          <td class="table-cell font-medium">{{ p.name }}</td>
          <td class="table-cell text-muted">{{ p.institutionType ?? '—' }}</td>
          <td class="table-cell text-muted">{{ parentName(p.parentId) }}</td>
          <td class="table-cell">
            <div class="flex gap-1 justify-end">
              <button
                class="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg border-none cursor-pointer bg-purple-100 text-purple-600 hover:bg-purple-200"
                title="Credentials"
                @click="openCredentialsModal(p)"
              >Creds</button>
              <button
                class="btn-icon inline-flex items-center justify-center w-7 h-7 text-xs rounded border-none cursor-pointer bg-gray-100 text-gray-600 hover:bg-gray-200"
                title="Edit"
                @click="openEdit(p)"
              >{{ Icons.edit }}</button>
              <button
                class="btn-icon delete inline-flex items-center justify-center w-7 h-7 text-xs rounded border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
                title="Delete"
                @click="confirmDelete(p)"
              >{{ Icons.delete }}</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

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
