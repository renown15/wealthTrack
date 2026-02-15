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
            <th :class="styles['sortable-header']" @click="toggleSort('classKey')">
              Class Key
              <span :class="styles['sort-indicator']">{{ getSortIndicator('classKey') }}</span>
            </th>
            <th :class="styles['sortable-header']" @click="toggleSort('referenceValue')">
              Reference Value
              <span :class="styles['sort-indicator']">{{ getSortIndicator('referenceValue') }}</span>
            </th>
            <th :class="styles['sortable-header']" @click="toggleSort('sortIndex')">
              Sort Index
              <span :class="styles['sort-indicator']">{{ getSortIndicator('sortIndex') }}</span>
            </th>
            <th :class="styles['sortable-header']" @click="toggleSort('updatedAt')">
              Updated
              <span :class="styles['sort-indicator']">{{ getSortIndicator('updatedAt') }}</span>
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
              <ReferenceDataTableActions
                :item="item"
                :editing-id="editingId"
                :saving-id="savingId"
                :deleting-id="deletingId"
                @start-edit="handleStartEdit"
                @cancel-edit="cancelEdit"
                @save-edit="handleSaveEdit"
                @delete="deleteItem"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type Ref } from 'vue';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import { Icons } from '@/constants/icons';
import ReferenceDataTableActions from '@views/ReferenceDataTableActions.vue';
import styles from '@views/ReferenceDataTable.module.css';

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
  'sort-change': [
    key: keyof ExtendedReferenceDataItem,
    direction: 'asc' | 'desc'
  ];
}>();

const filterText: Ref<string> = ref('');
const filterClassKey: Ref<string> = ref('');
const editingId: Ref<number | null> = ref(null);
const savingId: Ref<number | null> = ref(null);
const deletingId: Ref<number | null> = ref(null);
const editForm = ref({
  referenceValue: '',
  sortIndex: undefined as number | undefined,
});

const uniqueClassKeys = computed((): string[] => {
  const keys = new Set(props.data.map((item) => item.classKey));
  return Array.from(keys).sort();
});

const filteredData = computed((): ExtendedReferenceDataItem[] => {
  const filtered = props.data.filter((item) => {
    const matchesText =
      filterText.value === '' ||
      item.classKey.toLowerCase().includes(filterText.value.toLowerCase()) ||
      item.referenceValue
        .toLowerCase()
        .includes(filterText.value.toLowerCase());
    const matchesClassKey =
      filterClassKey.value === '' || item.classKey === filterClassKey.value;
    return matchesText && matchesClassKey;
  });

  return [...filtered].sort((a, b) => {
    const key = props.sortKey;
    const dir = props.sortDirection === 'asc' ? 1 : -1;
    const aVal = a[key] ?? '';
    const bVal = b[key] ?? '';
    if (typeof aVal === 'number' && typeof bVal === 'number')
      return (aVal - bVal) * dir;
    return String(aVal).localeCompare(String(bVal)) * dir;
  });
});

const toggleSort = (key: keyof ExtendedReferenceDataItem): void => {
  if (props.sortKey === key) {
    const newDir = props.sortDirection === 'asc' ? 'desc' : 'asc';
    emit('sort-change', key, newDir);
  } else {
    emit('sort-change', key, 'asc');
  }
};

const getSortIndicator = (key: keyof ExtendedReferenceDataItem): string => {
  return props.sortKey === key
    ? props.sortDirection === 'asc'
      ? Icons.sortAsc
      : Icons.sortDesc
    : '';
};

const startEdit = (item: ExtendedReferenceDataItem): void => {
  editingId.value = item.id;
  editForm.value = {
    referenceValue: item.referenceValue,
    sortIndex: item.sortIndex,
  };
};

const cancelEdit = (): void => {
  editingId.value = null;
};

const saveEdit = (id: number): void => {
  if (!editForm.value.referenceValue.trim()) return;
  savingId.value = id;
  emit('edit', id, editForm.value);
  editingId.value = null;
  savingId.value = null;
};

const deleteItem = (id: number): void => {
  emit('delete', id);
};

const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const handleStartEdit = (item: ExtendedReferenceDataItem): void => {
  startEdit(item);
};

const handleSaveEdit = (id: number): void => {
  saveEdit(id);
};
</script>

