<template>
  <div v-if="institutions.length > 0" class="institutions-section">
    <h3 class="text-lg font-semibold mb-4">Institutions</h3>
    <div class="list-container">
      <div v-for="institution in institutions" :key="institution.id" class="list-item">
        <div>
          <span class="list-item-name">{{ institution.name }}</span>
          <div v-if="institution.parentId" class="text-sm text-gray-500 mt-1">
            Parent: {{ getParentName(institution.parentId) }}
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button
            class="btn-icon edit inline-flex items-center justify-center w-9 h-9 text-lg rounded-lg border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
            @click="emitEdit(institution)"
            title="Edit"
          >{{ Icons.edit }}</button>
          <button
            class="btn-icon delete inline-flex items-center justify-center w-9 h-9 text-lg rounded-lg border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
            @click="emitDelete(institution.id, institution.name)"
            title="Delete"
          >{{ Icons.delete }}</button>
          <button
            class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
            type="button"
            @click="emitManage(institution)"
          >
            Credentials
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Institution } from '@/models/WealthTrackDataModels';
import { Icons } from '@/constants/icons';

const props = defineProps<{
  institutions: Institution[];
}>();

const emit = defineEmits<{
  editInstitution: [institution: Institution];
  deleteInstitution: [id: number, name: string];
  manageCredentials: [institution: Institution];
}>();

const getParentName = (parentId: number): string => {
  const parent = props.institutions.find((i) => i.id === parentId);
  return parent ? parent.name : 'Unknown';
};

const emitEdit = (institution: Institution): void => {
  emit('editInstitution', institution);
};

const emitDelete = (id: number, name: string): void => {
  emit('deleteInstitution', id, name);
};
    
const emitManage = (institution: Institution): void => {
  emit('manageCredentials', institution);
};
</script>

<!-- Uses UnoCSS utilities via shortcuts -->
