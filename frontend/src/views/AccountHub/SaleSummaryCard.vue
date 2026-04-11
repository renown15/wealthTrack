<template>
  <div class="border border-gray-200 rounded-lg overflow-hidden text-sm">
    <div class="bg-gray-50 px-4 py-2 flex justify-between items-center">
      <span class="font-semibold text-gray-700">Sale — {{ formatDate(sale.soldAt) }}</span>
      <span v-if="sale.groupId" class="text-gray-400 text-xs">Group #{{ sale.groupId }}</span>
    </div>

    <div class="grid grid-cols-2 gap-x-6 gap-y-1 px-4 py-3">
      <!-- Shares -->
      <div class="text-gray-500">Shares sold</div>
      <div class="text-right font-medium">{{ sale.sharesSold ?? '—' }}</div>

      <div class="text-gray-500">Remaining shares</div>
      <div class="text-right font-medium">{{ sale.remainingShares ?? '—' }}</div>

      <div class="text-gray-500">Sale price per share</div>
      <div class="text-right font-medium">{{ formatPence(sale.salePricePence) }}</div>

      <div class="text-gray-500">Purchase price per share</div>
      <div class="text-right font-medium">{{ formatPence(sale.purchasePricePence) }}</div>

      <div class="col-span-2 border-t border-gray-100 my-1" />

      <!-- Money -->
      <div class="text-gray-500">Proceeds</div>
      <div class="text-right font-medium">{{ formatGBP(sale.proceeds) }}</div>

      <div class="text-gray-500">Capital gain</div>
      <div class="text-right font-medium">{{ formatGBP(sale.capitalGain) }}</div>

      <div class="text-gray-500">CGT rate</div>
      <div class="text-right font-medium">{{ sale.cgtRate ? sale.cgtRate + '%' : '—' }}</div>

      <div class="text-gray-500">CGT owed</div>
      <div class="text-right font-medium text-red-600">{{ formatGBP(sale.cgt) }}</div>

      <div class="col-span-2 border-t border-gray-100 my-1" />

      <!-- New balances -->
      <div class="text-gray-500">Cash account new balance</div>
      <div class="text-right font-medium">{{ formatGBP(sale.cashNewBalance) }}</div>

      <div v-if="cashAccountName" class="text-gray-400 col-span-2 text-xs text-right -mt-1">{{ cashAccountName }}</div>

      <div class="text-gray-500">Tax liability balance</div>
      <div class="text-right font-medium text-red-600">{{ formatGBP(sale.taxNewBalance) }}</div>

      <div v-if="taxAccountName" class="text-gray-400 col-span-2 text-xs text-right -mt-1">{{ taxAccountName }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ShareSaleSummary, ShareSaleSummaryEvent } from '@/models/ShareSaleModels';
import type { PortfolioItem } from '@/models/WealthTrackDataModels';

const props = defineProps<{
  sale: ShareSaleSummary;
  allItems: PortfolioItem[];
}>();

const depositEvent = computed(() =>
  props.sale.events.find((e: ShareSaleSummaryEvent) => e.eventType === 'Deposit')
);
const liabilityEvent = computed(() =>
  props.sale.events.find((e: ShareSaleSummaryEvent) => e.eventType === 'Capital Gains Tax')
);

const cashAccountName = computed(() => {
  const id = depositEvent.value?.accountId;
  if (!id) return null;
  return props.allItems.find((i) => i.account.id === id)?.account.name ?? null;
});

const taxAccountName = computed(() => {
  const id = liabilityEvent.value?.accountId;
  if (!id) return null;
  return props.allItems.find((i) => i.account.id === id)?.account.name ?? null;
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatGBP(value: string | null | undefined): string {
  if (!value) return '—';
  const n = parseFloat(value);
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
}

function formatPence(pence: string | null | undefined): string {
  if (!pence) return '—';
  const n = parseFloat(pence);
  if (Number.isNaN(n)) return pence;
  const pounds = n / 100;
  return `${pence}p (${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pounds)})`;
}
</script>
