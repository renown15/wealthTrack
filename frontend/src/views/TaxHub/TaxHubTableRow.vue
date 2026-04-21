<template>
  <tr
    class="table-row-hover cursor-grab active:cursor-grabbing"
    draggable="true"
    @dragstart="emit('dragStart', account.accountId)"
  >
    <td class="table-cell font-semibold">{{ account.accountName }}</td>
    <td class="table-cell">{{ account.institutionName ?? '—' }}</td>
    <td class="table-cell">{{ account.accountNumber ?? '—' }}</td>
    <td class="table-cell">{{ account.sortCode ?? '—' }}</td>
    <td class="table-cell">{{ account.rollRefNumber ?? '—' }}</td>
    <td class="table-cell">{{ account.accountType }}</td>
    <td class="table-cell">
      <span
        class="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full"
        :class="account.accountStatus === 'Closed' ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'"
        :title="account.accountStatus ?? ''"
      >{{ account.accountStatus === 'Closed' ? 'C' : 'O' }}</span>
    </td>
    <td class="table-cell">
      {{ account.eligibilityReason === 'interest_bearing' ? (account.interestRate ?? '—') : '—' }}
    </td>
    <td class="table-cell">
      <span v-if="account.eligibilityReason === 'interest_bearing'">
        {{ formatCurrency(account.taxReturn?.income) }}
      </span>
      <span v-else class="text-muted">—</span>
    </td>
    <td class="table-cell">
      <span v-if="account.eligibilityReason === 'sold_in_period'">
        {{ formatCurrency(account.taxReturn?.capitalGain) }}
      </span>
      <span v-else class="text-muted">—</span>
    </td>
    <td class="table-cell">{{ formatCurrency(account.taxReturn?.taxTakenOff) }}</td>
    <td class="table-cell">
      <button
        class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded bg-blue-100 text-blue-600 hover:bg-blue-200 border-none cursor-pointer"
        :title="`View ${account.eventCount} events`"
        @click="emit('showEvents', account)"
      >{{ account.eventCount }}</button>
    </td>
    <td class="table-cell"><span class="font-medium">{{ account.documents.length }}</span></td>
    <td class="table-cell">
      <div class="actions-col">
        <button
          class="btn-icon edit inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
          title="Edit tax return"
          @click="emit('editReturn', account)"
        >{{ Icons.edit }}</button>
        <button
          class="btn-icon inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-green-100 text-green-600 hover:bg-green-200"
          title="Manage documents"
          @click="emit('manageDocuments', account)"
        >{{ Icons.eye }}</button>
        <button
          v-if="section === 'eligible'"
          class="btn-icon inline-flex items-center justify-center w-8 h-8 text-sm font-bold rounded border-none cursor-pointer bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
          title="Add to scope"
          @click="emit('moveToInScope', account.accountId)"
        >+</button>
        <button
          v-if="section === 'inScope'"
          class="btn-icon inline-flex items-center justify-center w-8 h-8 text-sm font-bold rounded border-none cursor-pointer bg-gray-100 text-gray-600 hover:bg-gray-200"
          title="Remove from scope"
          @click="emit('moveToEligible', account.accountId)"
        >−</button>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { EligibleAccount } from '@models/TaxModels';
import { Icons } from '@/constants/icons';

defineProps<{
  account: EligibleAccount;
  section: 'inScope' | 'eligible';
}>();

const emit = defineEmits<{
  editReturn: [account: EligibleAccount];
  manageDocuments: [account: EligibleAccount];
  showEvents: [account: EligibleAccount];
  dragStart: [accountId: number];
  moveToInScope: [accountId: number];
  moveToEligible: [accountId: number];
}>();

function formatCurrency(val: number | null | undefined): string {
  if (val == null) return '—';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val);
}
</script>
