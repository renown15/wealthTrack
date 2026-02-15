<template>
  <div v-if="institutions.length > 0" class="institutions-section">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-gray-700">Group by Parent</span>
        <button
          class="relative w-14 h-7 rounded-full transition-colors duration-200 border-none cursor-pointer"
          :class="groupByParent ? 'bg-blue-600' : 'bg-gray-300'"
          @click="groupByParent = !groupByParent"
          title="Toggle grouping"
        >
          <span
            class="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
            :class="groupByParent ? 'translate-x-7' : 'translate-x-0'"
          />
        </button>
      </div>
    </div>

    <div class="overflow-x-auto border border-gray-200 rounded-lg">
      <table class="w-full">
        <thead class="border-b-2 border-gray-200 bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Institution</th>
            <th class="px-4 py-3 text-right text-sm font-semibold text-gray-600">Total Invested Balance</th>
            <th class="px-4 py-3 text-right text-sm font-semibold text-gray-600">Remaining Insured Capacity</th>
            <th class="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- Ungrouped View -->
          <template v-if="!groupByParent">
            <tr v-for="institution in institutions" :key="institution.id" class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-4 py-3 font-medium text-gray-900">{{ institution.name }}</td>
              <td class="px-4 py-3 text-right font-semibold text-gray-900">
                {{ formatCurrency(getInstitutionBalance(institution.id)) }}
              </td>
              <td v-if="!institution.parentId && (institution.institutionType === 'Bank' || institution.institutionType === 'Building Society')" class="px-4 py-3 text-right font-semibold" :class="getCapacityColor(getInstitutionBalance(institution.id))">
                {{ formatCurrency(getCapacity(getInstitutionBalance(institution.id))) }}
              </td>
              <td v-else class="px-4 py-3 text-right font-semibold text-gray-400">
                —
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    class="btn-icon edit inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                    @click="emitEdit(institution)"
                    title="Edit"
                  >{{ Icons.edit }}</button>
                  <button
                    class="btn-icon delete inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
                    @click="emitDelete(institution.id, institution.name)"
                    title="Delete"
                  >{{ Icons.delete }}</button>
                  <button
                    class="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                    type="button"
                    @click="emitManage(institution)"
                  >
                    Creds
                  </button>
                </div>
              </td>
            </tr>
          </template>

          <!-- Grouped View -->
          <template v-else>
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

                <!-- Parent Institution (if has balance and has children) -->
                <template v-if="getInstitutionBalance(group.parentId!) > 0 && group.institutions.some(inst => inst.parentId)">
                  <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="px-4 py-3 pl-12 font-medium text-gray-800">
                      <span class="text-blue-500 mr-2">└</span>{{ group.parentName }}
                    </td>
                    <td class="px-4 py-3 text-right font-semibold text-gray-900">
                      {{ formatCurrency(getInstitutionBalance(group.parentId!)) }}
                    </td>
                    <td v-if="group.parentType === 'Bank' || group.parentType === 'Building Society'" class="px-4 py-3 text-right font-semibold" :class="getCapacityColor(getInstitutionBalance(group.parentId!))">
                      {{ formatCurrency(getCapacity(getInstitutionBalance(group.parentId!))) }}
                    </td>
                    <td v-else class="px-4 py-3 text-right font-semibold text-gray-400">
                      —
                    </td>
                    <td class="px-4 py-3 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          class="btn-icon edit inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                          @click="emitEdit(group.institutions.find(i => i.id === group.parentId)!)"
                          title="Edit"
                        >{{ Icons.edit }}</button>
                        <button
                          class="btn-icon delete inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
                          @click="emitDelete(group.parentId!, group.parentName)"
                          title="Delete"
                        >{{ Icons.delete }}</button>
                        <button
                          class="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                          type="button"
                          @click="emitManage(group.institutions.find(i => i.id === group.parentId)!)"
                        >
                          Creds
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>

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
                        @click="emitEdit(institution)"
                        title="Edit"
                      >{{ Icons.edit }}</button>
                      <button
                        class="btn-icon delete inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
                        @click="emitDelete(institution.id, institution.name)"
                        title="Delete"
                      >{{ Icons.delete }}</button>
                      <button
                        class="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                        type="button"
                        @click="emitManage(institution)"
                      >
                        Creds
                      </button>
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
                        @click="emitEdit(institution)"
                        title="Edit"
                      >{{ Icons.edit }}</button>
                      <button
                        class="btn-icon delete inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
                        @click="emitDelete(institution.id, institution.name)"
                        title="Delete"
                      >{{ Icons.delete }}</button>
                      <button
                        class="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                        type="button"
                        @click="emitManage(institution)"
                      >
                        Creds
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
            </template>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Institution, PortfolioItem } from '@/models/WealthTrackDataModels';
import { Icons } from '@/constants/icons';

const props = defineProps<{
  institutions: Institution[];
  portfolioItems: PortfolioItem[];
}>();

const DEPOSIT_INSURANCE_LIMIT = 125000;

const emit = defineEmits<{
  editInstitution: [institution: Institution];
  deleteInstitution: [id: number, name: string];
  manageCredentials: [institution: Institution];
}>();

const groupByParent = ref(true);

const getCapacity = (balance: number): number => {
  return DEPOSIT_INSURANCE_LIMIT - balance;
};

const getCapacityPercentage = (balance: number): number => {
  const percentage = (balance / DEPOSIT_INSURANCE_LIMIT) * 100;
  return Math.round(percentage);
};

const getCapacityColor = (balance: number): string => {
  const capacity = getCapacity(balance);
  if (capacity <= 0) {
    return 'text-red-600 font-semibold';
  }
  const capacityPercent = (capacity / DEPOSIT_INSURANCE_LIMIT) * 100;
  if (capacityPercent <= 20) {
    return 'text-amber-600 font-semibold';
  }
  return 'text-green-600 font-semibold';
};

const getParentName = (parentId: number): string => {
  const parent = props.institutions.find((i) => i.id === parentId);
  return parent ? parent.name : 'Unknown';
};

const getInstitutionBalance = (institutionId: number): number => {
  return props.portfolioItems
    .filter((item) => item.account.institutionId === institutionId)
    .reduce((sum, item) => {
      if (item.latestBalance?.value) {
        return sum + parseFloat(item.latestBalance.value);
      }
      return sum;
    }, 0);
};

const formatCurrency = (value: number): string => {
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(value);
};

interface GroupedInstitution {
  parentId: number | null | undefined;
  parentName: string;
  parentType?: string | null;
  institutions: Institution[];
  totalBalance: number;
}

const groupedInstitutions = computed(() => {
  const groups = new Map<number | null | undefined, GroupedInstitution>();

  // First pass: create groups for parent institutions
  props.institutions.forEach((institution) => {
    if (!institution.parentId) {
      // This is a parent institution
      if (!groups.has(institution.id)) {
        groups.set(institution.id, {
          parentId: institution.id,
          parentName: institution.name,
          parentType: institution.institutionType,
          institutions: [institution],
          totalBalance: getInstitutionBalance(institution.id),
        });
      }
    }
  });

  // Second pass: add child institutions to their parent groups
  props.institutions.forEach((institution) => {
    if (institution.parentId) {
      // This is a child institution
      const group = groups.get(institution.parentId);
      if (group) {
        group.institutions.push(institution);
        group.totalBalance += getInstitutionBalance(institution.id);
      }
    }
  });

  // Handle ungrouped institutions (those without a parent and no children)
  const ungrouped = props.institutions.filter(
    (inst) => !inst.parentId && !groups.has(inst.id),
  );
  if (ungrouped.length > 0) {
    groups.set(null, {
      parentId: null,
      parentName: 'Ungrouped',
      institutions: ungrouped,
      totalBalance: ungrouped.reduce((sum, inst) => sum + getInstitutionBalance(inst.id), 0),
    });
  }

  return Array.from(groups.values());
});

const hasChildren = (parentId: number): boolean => {
  return props.institutions.some((inst) => inst.parentId === parentId);
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
