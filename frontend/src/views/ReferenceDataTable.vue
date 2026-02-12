<template>
  <div class="hub-content-card p-6">
    <div class="mb-4 flex gap-2">
      <input
        v-model="filterText"
        type="text"
        placeholder="Search by class key..."
        class="form-input flex-1"
      />
      <select v-model="filterClassKey" class="form-select w-40">
        <option value="">All class keys</option>
        <option
          v-for="classKey in uniqueClassKeys"
          :key="classKey"
          :value="classKey"
        >
          {{ classKey }}
        </option>
      </select>
    </div>

    <div class="table-wrap">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-border bg-gray-50">
            <th class="sortable-header" @click="toggleSort('classKey')">
              Class Key
              <span class="sort-indicator">{{ getSortIndicator('classKey') }}</span>
            </th>
            <th class="sortable-header" @click="toggleSort('referenceValue')">
              Reference Value
              <span class="sort-indicator">{{ getSortIndicator('referenceValue') }}</span>
            </th>
            <th class="sortable-header" @click="toggleSort('sortIndex')">
              Sort Index
              <span class="sort-indicator">{{ getSortIndicator('sortIndex') }}</span>
            </th>
            <th class="sortable-header" @click="toggleSort('updatedAt')">
              Updated
              <span class="sort-indicator">{{ getSortIndicator('updatedAt') }}</span>
            </th>
            <th class="py-3 px-4 text-center font-semibold text-text-dark">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in filteredData"
            :key="item.id"
            class="border-b border-border hover:bg-gray-50 transition"
          >
            <td class="py-3 px-4 text-text-dark">{{ item.classKey }}</td>
            <td class="py-3 px-4 text-text-dark">
              <span v-if="editingId !== item.id">{{ item.referenceValue }}</span>
              <input
                v-else
                v-model="editForm.referenceValue"
                type="text"
                class="form-input"
                @keydown.enter="saveEdit(item.id)"
                @keydown.escape="cancelEdit"
              />
            </td>
            <td class="py-3 px-4 text-text-dark">
              <span v-if="editingId !== item.id">{{ item.sortIndex ?? '-' }}</span>
              <input
                v-else
                v-model.number="editForm.sortIndex"
                type="number"
                class="form-input w-20"
                @keydown.enter="saveEdit(item.id)"
                @keydown.escape="cancelEdit"
              />
            </td>
            <td class="py-3 px-4 text-gray-600">
              {{ formatDate(item.updatedAt) }}
            </td>
            <td class="py-3 px-4 text-center">
              <div class="flex justify-center gap-2">
                <button
                  v-if="editingId !== item.id"
                  class="btn-icon-edit"
                  type="button"
                  @click="startEdit(item)"
                  title="Edit"
                >{{ Icons.edit }}</button>
                <button
                  v-if="editingId === item.id"
                  class="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  @click="saveEdit(item.id)"
                  title="Save"
                  :disabled="savingId === item.id"
                >{{ Icons.save }}</button>
                <button
                  v-if="editingId === item.id"
                  class="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                  type="button"
                  @click="cancelEdit"
                  title="Cancel"
                >{{ Icons.cancel }}</button>
                <button
                  v-if="editingId !== item.id"
                  class="btn-icon-delete"
                  type="button"
                  @click="deleteItem(item.id)"
                  :disabled="deletingId === item.id"
                  title="Delete"
                >{{ Icons.delete }}</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import { Icons } from '@/constants/icons';

interface ExtendedReferenceDataItem extends ReferenceDataItem {
  updatedAt: string;
}

const props = defineProps<{
  data: ExtendedReferenceDataItem[];
  sortKey: keyof ExtendedReferenceDataItem;
  sortDirection: 'asc' | 'desc';
}>();

const emit = defineEmits<{
  edit: [id: number, data: { referenceValue: string; sortIndex?: number }];
  delete: [id: number];
  'sort-change': [key: keyof ExtendedReferenceDataItem, direction: 'asc' | 'desc'];
}>();

const filterText = ref('');
const filterClassKey = ref('');
const editingId = ref<number | null>(null);
const savingId = ref<number | null>(null);
const deletingId = ref<number | null>(null);
const editForm = ref({
  referenceValue: '',
  sortIndex: undefined as number | undefined,
});

const uniqueClassKeys = computed(() => {
  const keys = new Set(props.data.map(item => item.classKey));
  return Array.from(keys).sort();
});

const filteredData = computed(() => {
  const filtered = props.data.filter(item => {
    const matchesText = filterText.value === ''
      || item.classKey.toLowerCase().includes(filterText.value.toLowerCase())
      || item.referenceValue.toLowerCase().includes(filterText.value.toLowerCase());
    const matchesClassKey = filterClassKey.value === ''
      || item.classKey === filterClassKey.value;
    return matchesText && matchesClassKey;
  });

  return [...filtered].sort((a, b) => {
    const key = props.sortKey;
    const dir = props.sortDirection === 'asc' ? 1 : -1;
    const aVal = a[key] ?? '';
    const bVal = b[key] ?? '';
    if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
    return String(aVal).localeCompare(String(bVal)) * dir;
  });
});

function toggleSort(key: keyof ExtendedReferenceDataItem): void {
  if (props.sortKey === key) {
    const newDir = props.sortDirection === 'asc' ? 'desc' : 'asc';
    emit('sort-change', key, newDir);
  } else {
    emit('sort-change', key, 'asc');
  }
}

function getSortIndicator(key: keyof ExtendedReferenceDataItem): string {
  if (props.sortKey !== key) return '';
  return props.sortDirection === 'asc' ? Icons.sortAsc : Icons.sortDesc;
}

function startEdit(item: ExtendedReferenceDataItem): void {
  editingId.value = item.id;
  editForm.value = {
    referenceValue: item.referenceValue,
    sortIndex: item.sortIndex,
  };
}

function cancelEdit(): void {
  editingId.value = null;
}

async function saveEdit(id: number): Promise<void> {
  if (!editForm.value.referenceValue.trim()) return;
  savingId.value = id;
  emit('edit', id, editForm.value);
  editingId.value = null;
  savingId.value = null;
}

function deleteItem(id: number): void {
  deletingId.value = id;
  emit('delete', id);
  deletingId.value = null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<style scoped>
.sortable-header {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--text-dark, #1f2937);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s;
}
.sortable-header:hover {
  background-color: #e5e7eb;
}
.sort-indicator {
  margin-left: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}
</style>
