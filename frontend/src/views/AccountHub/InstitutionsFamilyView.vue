<template>
  <div v-if="institutionsWithMembers.length > 0" class="institutions-section">
    <div class="overflow-x-auto border border-gray-200 rounded-lg">
      <table class="w-full">
        <thead class="border-b-2 border-gray-200 bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Institution / Member</th>
            <th class="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
            <th class="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Remaining Insured Capacity</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="entry in institutionsWithMembers" :key="entry.institution.id">
            <tr class="bg-blue-50 border-b-2 border-blue-100">
              <td class="px-4 py-2 text-sm font-semibold text-gray-900">{{ entry.institution.name }}</td>
              <td class="px-4 py-2 text-sm text-right font-semibold text-gray-900">{{ formatCurrency(entry.totalBalance) }}</td>
              <td v-if="isInsured(entry.institution)" class="px-4 py-2 text-sm text-right font-semibold" :class="totalCapacityColor(entry)">
                {{ formatCurrency(totalCapacity(entry)) }}
              </td>
              <td v-else class="px-4 py-2 text-sm text-right text-gray-400">—</td>
            </tr>
            <tr
              v-for="mb in entry.memberBalances"
              :key="mb.member.accountId"
              class="border-b border-gray-100 hover:bg-gray-50"
            >
              <td class="px-4 py-2 text-sm pl-8 text-gray-700 flex items-center gap-2">
                <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold shrink-0">{{ initials(mb.member) }}</span>
                {{ mb.member.firstName }} {{ mb.member.lastName }}
              </td>
              <td class="px-4 py-2 text-sm text-right text-gray-700">{{ formatCurrency(mb.balance) }}</td>
              <td v-if="isInsured(entry.institution)" class="px-4 py-2 text-sm text-right" :class="memberCapacityColor(mb.balance)">
                {{ formatCurrency(LIMIT - mb.balance) }}
              </td>
              <td v-else class="px-4 py-2 text-sm text-right text-gray-400">—</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PortfolioItem, Institution } from '@/models/WealthTrackDataModels';
import type { FamilyMember } from '@/models/family';
import { deriveInstitutionsWithMembers, type InstitutionWithMembers } from '@composables/useFamilyInstitutions';

const props = defineProps<{
  portfolioItems: PortfolioItem[];
  members: FamilyMember[];
}>();

const LIMIT = 125000;

const institutionsWithMembers = computed<InstitutionWithMembers[]>(() =>
  deriveInstitutionsWithMembers(props.portfolioItems, props.members),
);

const isInsured = (inst: Institution): boolean =>
  inst.institutionType === 'Bank' || inst.institutionType === 'Building Society';

const totalCapacity = (entry: InstitutionWithMembers): number =>
  entry.memberBalances.reduce((sum, mb) => sum + (LIMIT - mb.balance), 0);

const totalCapacityColor = (entry: InstitutionWithMembers): string => {
  if (entry.memberBalances.some((mb) => mb.balance > LIMIT)) return 'text-red-600 font-semibold';
  if (entry.memberBalances.some((mb) => (LIMIT - mb.balance) / LIMIT <= 0.2)) return 'text-amber-600 font-semibold';
  return 'text-green-600 font-semibold';
};

const memberCapacityColor = (balance: number): string => {
  if (balance > LIMIT) return 'text-red-600';
  if ((LIMIT - balance) / LIMIT <= 0.2) return 'text-amber-600';
  return 'text-green-600';
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const initials = (m: FamilyMember): string =>
  `${m.firstName.charAt(0)}${m.lastName.charAt(0)}`.toUpperCase();
</script>
