<template>
  <tr
    class="table-row-hover cursor-grab active:cursor-grabbing"
    draggable="true"
    @dragstart="emit('dragStart', account.accountId)"
  >
    <td class="table-cell font-semibold cursor-default" @mouseenter="onNameEnter" @mouseleave="onNameLeave">
      {{ account.accountName }}
      <AccountHoverCard v-if="portfolioItem" :item="portfolioItem" :anchor-rect="hoverRect" :visible="hovered" />
    </td>
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
    <td class="table-cell">{{ formatCurrency(account.taxReturn?.income) }}</td>
    <td class="table-cell">{{ formatCurrency(account.taxReturn?.capitalGain) }}</td>
    <td class="table-cell">{{ formatCurrency(account.taxReturn?.taxTakenOff) }}</td>
    <td class="table-cell">{{ account.firstBalanceDate ?? 'No balance' }}</td>
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
import { ref } from 'vue';
import type { EligibleAccount } from '@models/TaxModels';
import type { PortfolioItem } from '@models/WealthTrackDataModels';
import { Icons } from '@/constants/icons';
import AccountHoverCard from '@views/AccountHub/AccountHoverCard.vue';

defineProps<{
  account: EligibleAccount;
  portfolioItem: PortfolioItem | null;
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

const hovered = ref(false);
const hoverRect = ref<DOMRect | null>(null);
let showTimer: ReturnType<typeof setTimeout> | null = null;

function onNameEnter(e: MouseEvent): void {
  hoverRect.value = (e.currentTarget as HTMLElement).getBoundingClientRect();
  showTimer = setTimeout(() => { hovered.value = true; }, 300);
}

function onNameLeave(): void {
  if (showTimer) { clearTimeout(showTimer); showTimer = null; }
  hovered.value = false;
}

function formatCurrency(val: number | null | undefined): string {
  if (val == null) return '—';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val);
}
</script>
