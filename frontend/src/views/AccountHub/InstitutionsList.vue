<template>
  <div v-if="institutions.length > 0" class="institutions-section">
    <div class="overflow-x-auto border border-gray-200 rounded-lg">
      <table class="w-full">
        <thead class="border-b-2 border-gray-200 bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Institution</th>
            <th class="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Invested Balance</th>
            <th class="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Remaining Insured Capacity</th>
            <th v-if="!readOnly" class="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- Ungrouped View -->
          <template v-if="!groupByParent">
            <tr v-for="institution in institutions" :key="institution.id" class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-4 py-2 text-sm font-medium text-gray-900">{{ institution.name }}</td>
              <td class="px-4 py-2 text-sm text-right font-semibold text-gray-900">
                {{ formatCurrency(getInstitutionBalance(institution.id)) }}
              </td>
              <td v-if="!institution.parentId && (institution.institutionType === 'Bank' || institution.institutionType === 'Building Society')" class="px-4 py-2 text-sm text-right font-semibold" :class="getCapacityColor(getInstitutionBalance(institution.id))">
                {{ formatCurrency(getCapacity(getInstitutionBalance(institution.id))) }}
              </td>
              <td v-else class="px-4 py-2 text-sm text-right font-semibold text-gray-400">—</td>
              <td v-if="!readOnly" class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button class="btn-icon edit inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200" @click="emitEdit(institution)" title="Edit">{{ Icons.edit }}</button>
                  <button class="btn-icon delete inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200" @click="emitDelete(institution.id, institution.name)" title="Delete">{{ Icons.delete }}</button>
                  <button class="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200" type="button" @click="emitManage(institution)">Creds</button>
                </div>
              </td>
            </tr>
          </template>

          <!-- Grouped View -->
          <template v-else>
            <InstitutionsGroupedView
              :grouped-institutions="groupedInstitutions"
              :get-institution-balance="getInstitutionBalance"
              :get-capacity="getCapacity"
              :get-capacity-color="getCapacityColor"
              :format-currency="formatCurrency"
              :has-children="hasChildren"
              :read-only="readOnly"
              @edit-institution="emitEdit"
              @delete-institution="emitDelete"
              @manage-credentials="emitManage"
            />
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Institution, PortfolioItem } from '@/models/WealthTrackDataModels';
import { Icons } from '@/constants/icons';
import InstitutionsGroupedView from '@views/AccountHub/InstitutionsGroupedView.vue';

const props = defineProps<{
  institutions: Institution[];
  portfolioItems: PortfolioItem[];
  groupByParent: boolean;
  readOnly?: boolean;
}>();

const DEPOSIT_INSURANCE_LIMIT = 125000;

const emit = defineEmits<{
  editInstitution: [institution: Institution];
  deleteInstitution: [id: number, name: string];
  manageCredentials: [institution: Institution];
}>();

const getCapacity = (balance: number): number => DEPOSIT_INSURANCE_LIMIT - balance;

const getCapacityColor = (balance: number): string => {
  const capacity = getCapacity(balance);
  if (capacity <= 0) return 'text-red-600 font-semibold';
  if ((capacity / DEPOSIT_INSURANCE_LIMIT) * 100 <= 20) return 'text-amber-600 font-semibold';
  return 'text-green-600 font-semibold';
};

const getInstitutionBalance = (institutionId: number): number =>
  props.portfolioItems
    .filter((item) => item.account.institutionId === institutionId)
    .reduce((sum, item) => sum + (item.latestBalance?.value ? parseFloat(item.latestBalance.value) : 0), 0);

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

interface GroupedInstitution {
  parentId: number | null | undefined;
  parentName: string;
  parentType?: string | null;
  institutions: Institution[];
  totalBalance: number;
}

const groupedInstitutions = computed(() => {
  const groups = new Map<number | null | undefined, GroupedInstitution>();
  props.institutions.forEach((institution) => {
    if (!institution.parentId) {
      groups.set(institution.id, {
        parentId: institution.id, parentName: institution.name,
        parentType: institution.institutionType, institutions: [institution],
        totalBalance: getInstitutionBalance(institution.id),
      });
    }
  });
  props.institutions.forEach((institution) => {
    if (institution.parentId) {
      const group = groups.get(institution.parentId);
      if (group) { group.institutions.push(institution); group.totalBalance += getInstitutionBalance(institution.id); }
    }
  });
  const ungrouped = props.institutions.filter((inst) => !inst.parentId && !groups.has(inst.id));
  if (ungrouped.length > 0) {
    groups.set(null, { parentId: null, parentName: 'Ungrouped', institutions: ungrouped, totalBalance: ungrouped.reduce((s, i) => s + getInstitutionBalance(i.id), 0) });
  }
  return Array.from(groups.values());
});

const hasChildren = (parentId: number): boolean => props.institutions.some((inst) => inst.parentId === parentId);
const emitEdit = (institution: Institution): void => { emit('editInstitution', institution); };
const emitDelete = (id: number, name: string): void => { emit('deleteInstitution', id, name); };
const emitManage = (institution: Institution): void => { emit('manageCredentials', institution); };
</script>

<!-- Uses UnoCSS utilities via shortcuts -->
