<template>
  <div class="flex justify-center gap-2">
    <button
      v-if="editingId !== item.id"
      class="btn-icon-edit"
      type="button"
      @click="startEdit(item)"
      title="Edit"
    >
      {{ Icons.edit }}
    </button>
    <button
      v-if="editingId === item.id"
      class="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
      type="button"
      @click="saveEdit(item.id)"
      title="Save"
      :disabled="savingId === item.id"
    >
      {{ Icons.save }}
    </button>
    <button
      v-if="editingId === item.id"
      class="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
      type="button"
      @click="cancelEdit"
      title="Cancel"
    >
      {{ Icons.cancel }}
    </button>
    <button
      v-if="editingId !== item.id"
      class="btn-icon-delete"
      type="button"
      @click="deleteItem(item.id)"
      :disabled="deletingId === item.id"
      title="Delete"
    >
      {{ Icons.delete }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ReferenceDataItem } from '@/models/ReferenceData';
import { Icons } from '@/constants/icons';

interface ExtendedReferenceDataItem extends ReferenceDataItem {
  updatedAt: string;
}

interface Props {
  item: ExtendedReferenceDataItem;
  editingId: number | null;
  savingId: number | null;
  deletingId: number | null;
}

interface Emits {
  'start-edit': [item: ExtendedReferenceDataItem];
  'cancel-edit': [];
  'save-edit': [id: number];
  delete: [id: number];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const startEdit = (item: ExtendedReferenceDataItem): void => {
  emit('start-edit', item);
};

const cancelEdit = (): void => {
  emit('cancel-edit');
};

const saveEdit = (id: number): void => {
  emit('save-edit', id);
};

const deleteItem = (id: number): void => {
  emit('delete', id);
};
</script>
