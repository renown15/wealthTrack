<template>
  <template v-for="(group, groupIdx) in groupedInstitutions" :key="`group-${group.parentId}`">
    <!-- Group with children -->
    <template v-if="group.parentId && hasChildren(group.parentId)">
      <!-- Group Header Row -->
      <tr class="bg-white border-b-2 border-blue-200 hover:bg-gray-50">
        <td class="px-4 py-3 font-semibold text-gray-900">📁 {{ group.parentName }}</td>
        <td class="px-4 py-3 text-right font-semibold text-gray-900">{{ formatCurrency(group.totalBalance) }}</td>
        <td v-if="group.parentType === 'Bank' || group.parentType === 'Building Society'" class="px-4 py-3 text-right font-semibold" :class="getCapacityColor(group.totalBalance)">{{ formatCurrency(getCapacity(group.totalBalance)) }}</td>
        <td v-else class="px-4 py-3 text-right font-semibold text-gray-400">—</td>
        <td class="px-4 py-3"></td>
      </tr>

      <!-- Child Institutions -->
      <tr
        v-for="(institution, instIdx) in group.institutions.filter(inst => inst.parentId)"
        :key="`inst-${institution.id}`"
        class="border-b border-gray-100 hover:bg-gray-50"
        :class="instIdx === group.institutions.filter(inst => inst.parentId).length - 1 ? 'border-b-2 border-blue-200' : ''"
      >
        <td class="px-4 py-3 pl-12 font-medium text-gray-800">
          <span class="text-blue-500 mr-2">└</span>{{ institution.name }}
        </td>
        <td class="px-4 py-3 text-right font-semibold text-gray-900">
          {{ formatCurrency(getInstitutionBalance(institution.id)) }}
        </td>
        <td class="px-4 py-3 text-right text-gray-400">—</td>
        <td class="px-4 py-3 text-right">
          <div class="flex items-center justify-end gap-2">
            <button
              class="btn-icon edit inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
              @click="$emit('editInstitution', institution)"
              title="Edit"
            >{{ Icons.edit }}</button>
            <button
              class="btn-icon delete inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
              @click="$emit('deleteInstitution', institution.id, institution.name)"
              title="Delete"
            >{{ Icons.delete }}</button>
            <button
              class="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
              type="button"
              @click="$emit('manageCredentials', institution)"
            >Creds</button>
          </div>
        </td>
      </tr>
    </template>

    <!-- Parent with no children (show as regular row) -->
    <template v-else>
      <tr v-for="institution in group.institutions" :key="`parent-${institution.id}`" class="border-b border-gray-100 hover:bg-gray-50">
        <td class="px-4 py-3 font-medium text-gray-900">{{ institution.name }}</td>
        <td class="px-4 py-3 text-right font-semibold text-gray-900">
          {{ formatCurrency(getInstitutionBalance(institution.id)) }}
        </td>
        <td v-if="institution.institutionType === 'Bank' || institution.institutionType === 'Building Society'" class="px-4 py-3 text-right font-semibold" :class="getCapacityColor(getInstitutionBalance(institution.id))">
          {{ formatCurrency(getCapacity(getInstitutionBalance(institution.id))) }}
        </td>
        <td v-else class="px-4 py-3 text-right font-semibold text-gray-400">
          —
        </td>
        <td class="px-4 py-3 text-right">
          <div class="flex items-center justify-end gap-2">
            <button
              class="btn-icon edit inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
              @click="$emit('editInstitution', institution)"
              title="Edit"
            >{{ Icons.edit }}</button>
            <button
              class="btn-icon delete inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
              @click="$emit('deleteInstitution', institution.id, institution.name)"
              title="Delete"
            >{{ Icons.delete }}</button>
            <button
              class="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
              type="button"
              @click="$emit('manageCredentials', institution)"
            >Creds</button>
          </div>
        </td>
      </tr>
    </template>
  </template>
</template>

<script setup lang="ts">
import type { Institution } from '@/models/WealthTrackDataModels';
import { Icons } from '@/constants/icons';

interface GroupedInstitution {
  parentId: number | null | undefined;
  parentName: string;
  parentType?: string | null;
  institutions: Institution[];
  totalBalance: number;
}

defineProps<{
  groupedInstitutions: GroupedInstitution[];
  getInstitutionBalance: (id: number) => number;
  getCapacity: (balance: number) => number;
  getCapacityColor: (balance: number) => string;
  formatCurrency: (value: number) => string;
  hasChildren: (parentId: number) => boolean;
}>();

defineEmits<{
  editInstitution: [institution: Institution];
  deleteInstitution: [id: number, name: string];
  manageCredentials: [institution: Institution];
}>();
</script>
