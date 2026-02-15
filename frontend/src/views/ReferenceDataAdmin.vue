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
import { ref, onMounted, computed } from 'vue';
import AddReferenceDataModal from '@views/AddReferenceDataModal.vue';
import DeleteReferenceDataModal from '@views/DeleteReferenceDataModal.vue';
import ReferenceDataTable from '@views/ReferenceDataTable.vue';
import { useReferenceDataCrud } from '@/composables/useReferenceDataCrud';
import type { ReferenceDataItem, ReferenceDataPayload } from '@/models/ReferenceData';

interface ExtendedReferenceDataItem extends ReferenceDataItem {updatedAt: string}

// CRUD composable
const { loading, error, data: referenceData, loadData, createItem, updateItem, deleteItem: deleteItemCrud } =
  useReferenceDataCrud();

// Local UI state
const addFormOpen = ref(false);
const deleteConfirmOpen = ref(false);
const deleteConfirmItem = ref<ExtendedReferenceDataItem | null>(null);
const formError = ref('');
const isSubmittingNew = ref(false);
const isDeleting = ref(false);
const sortKey = ref<keyof ExtendedReferenceDataItem>('classKey');
const sortDirection = ref<'asc' | 'desc'>('asc');

function clearError(): void { error.value = ''; }

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
    const result = await createItem(payload);
    if (result.success) {
      closeAddForm();
    } else {
      formError.value = result.error || 'Failed to create';
    }
  } finally {
    isSubmittingNew.value = false;
  }
}

async function handleEdit(
  id: number,
  data: { referenceValue: string; sortIndex?: number },
): Promise<void> {
  const item = referenceData.value.find((x: any) => x.id === id);
  if (!item) return;
  try {
    const payload: ReferenceDataPayload = {
      classKey: item.classKey,
      referenceValue: data.referenceValue,
      sortIndex: data.sortIndex,
    };
    await updateItem(id, payload);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update';
  }
}

function deleteItem(id: number): void {
  const item = referenceData.value.find((x: any) => x.id === id);
  if (item) {
    deleteConfirmItem.value = item as ExtendedReferenceDataItem;
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
    const result = await deleteItemCrud(deleteConfirmItem.value.id);
    if (result.success) {
      cancelDelete();
    } else {
      error.value = result.error || 'Failed to delete';
      cancelDelete();
    }
  } finally {
    isDeleting.value = false;
  }
}

onMounted(() => loadData());
</script>

