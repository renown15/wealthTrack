<template>
  <div class="page-view">
    <div class="hub-header-card">
      <div class="flex justify-between items-center p-6">
        <div>
          <h1 class="m-0 text-2xl font-bold text-text-dark">Reference Data Management</h1>
          <p class="m-0 mt-2 text-gray-600">Manage lookup tables and reference values</p>
        </div>
        <button class="btn-primary" @click="openAddForm">
          + Add Reference Data
        </button>
      </div>
    </div>

    <div v-if="error" class="hub-content-card p-6">
      <div class="error-banner">
        <span>{{ error }}</span>
        <button class="btn-close" @click="clearError">×</button>
      </div>
    </div>

    <div v-if="loading" class="hub-content-card p-8 loading-state">
      <div class="flex flex-col items-center">
        <div class="spinner"></div>
        <p class="mt-4 text-muted">Loading reference data...</p>
      </div>
    </div>

    <div v-else-if="referenceData.length === 0" class="hub-content-card p-8">
      <div class="text-center">
        <div class="empty-icon">📋</div>
        <h2 class="empty-title">No reference data yet</h2>
        <p class="empty-text">Create your first reference data entry</p>
        <button class="btn-add mt-4" @click="openAddForm">Add Reference Data</button>
      </div>
    </div>

    <ReferenceDataTable
      v-else
      :data="referenceData"
      :sort-key="sortKey"
      :sort-direction="sortDirection"
      @edit="handleEdit"
      @delete="deleteItem"
      @sort-change="(key, dir) => { sortKey = key; sortDirection = dir; }"
    />

    <AddReferenceDataModal
      :open="addFormOpen"
      :is-submitting="isSubmittingNew"
      :error="formError"
      @close="closeAddForm"
      @submit="submitNewForm"
    />

    <DeleteReferenceDataModal
      :open="deleteConfirmOpen"
      :item="deleteConfirmItem"
      :is-deleting="isDeleting"
      @cancel="cancelDelete"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AddReferenceDataModal from '@views/AddReferenceDataModal.vue';
import DeleteReferenceDataModal from '@views/DeleteReferenceDataModal.vue';
import ReferenceDataTable from '@views/ReferenceDataTable.vue';
import { referenceDataService } from '@/services/ReferenceDataService';
import type { ReferenceDataItem, ReferenceDataPayload } from '@/models/ReferenceData';

interface ExtendedReferenceDataItem extends ReferenceDataItem {updatedAt: string}

const loading = ref(true), error = ref(''), formError = ref(''), isDeleting = ref(false), isSubmittingNew = ref(false);
const referenceData = ref<ExtendedReferenceDataItem[]>([]), addFormOpen = ref(false), deleteConfirmOpen = ref(false);
const deleteConfirmItem = ref<ExtendedReferenceDataItem | null>(null);
const sortKey = ref<keyof ExtendedReferenceDataItem>('classKey');
const sortDirection = ref<'asc' | 'desc'>('asc');

function clearError(): void { error.value = ''; }

async function loadData(): Promise<void> {
  try {
    loading.value = true;
    error.value = '';
    const data = await referenceDataService.listAll();
    referenceData.value = data as ExtendedReferenceDataItem[];
  } catch (err) {
    const axiosErr = err as { response?: { data?: { detail?: string } } };
    error.value = axiosErr.response?.data?.detail
      || (err instanceof Error ? err.message : 'Failed to load');
  } finally {
    loading.value = false;
  }
}

function openAddForm(): void {
  formError.value = '';
  addFormOpen.value = true;
}

function closeAddForm(): void {
  addFormOpen.value = false;
  formError.value = '';
}

async function submitNewForm(form: { classKey: string; referenceValue: string; sortIndex: number | undefined }): Promise<void> {
  if (!form.classKey.trim() || !form.referenceValue.trim()) {
    formError.value = 'Required fields missing';
    return;
  }
  try {
    isSubmittingNew.value = true;
    formError.value = '';
    const payload: ReferenceDataPayload = {
      classKey: form.classKey,
      referenceValue: form.referenceValue,
      sortIndex: form.sortIndex,
    };
    await referenceDataService.create(payload);
    await loadData();
    closeAddForm();
  } catch (err) {
    const axiosErr = err as { response?: { data?: { detail?: string } } };
    formError.value = axiosErr.response?.data?.detail
      || (err instanceof Error ? err.message : 'Failed to create');
  } finally {
    isSubmittingNew.value = false;
  }
}

async function handleEdit(
  id: number,
  data: { referenceValue: string; sortIndex?: number },
): Promise<void> {
  const item = referenceData.value.find(x => x.id === id);
  if (!item) return;
  try {
    error.value = '';
    const payload: ReferenceDataPayload = {
      classKey: item.classKey,
      referenceValue: data.referenceValue,
      sortIndex: data.sortIndex,
    };
    await referenceDataService.update(id, payload);
    await loadData();
  } catch (err) {
    const axiosErr = err as { response?: { data?: { detail?: string } } };
    error.value = axiosErr.response?.data?.detail
      || (err instanceof Error ? err.message : 'Failed to update');
  }
}

function deleteItem(id: number): void {
  const item = referenceData.value.find(x => x.id === id);
  if (item) {
    deleteConfirmItem.value = item;
    deleteConfirmOpen.value = true;
  }
}

function cancelDelete(): void {
  deleteConfirmOpen.value = false;
  deleteConfirmItem.value = null;
}

async function confirmDelete(): Promise<void> {
  if (!deleteConfirmItem.value) return;
  try {
    isDeleting.value = true;
    error.value = '';
    await referenceDataService.delete(deleteConfirmItem.value.id);
    await loadData();
    cancelDelete();
  } catch (err) {
    // Extract detail from axios error response, fall back to error message
    const axiosErr = err as { response?: { data?: { detail?: string } } };
    error.value = axiosErr.response?.data?.detail
      || (err instanceof Error ? err.message : 'Failed to delete');
    cancelDelete(); // Close modal so error banner is visible
  } finally {
    isDeleting.value = false;
  }
}

onMounted(() => loadData());
</script>

