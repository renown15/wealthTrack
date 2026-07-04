<template>
  <tr :class="rowClass">
    <td class="table-cell">{{ item.institution?.name ?? '—' }}</td>
    <td class="table-cell font-medium">{{ item.account.name }}</td>
    <td class="table-cell">{{ item.accountType ?? '—' }}</td>
    <td class="table-cell text-muted">{{ item.account.accountNumber ?? '—' }}</td>
    <td class="table-cell">{{ monthlyCostDisplay }}</td>
    <td class="table-cell text-muted">{{ item.account.renewalType ?? '—' }}</td>
    <td class="table-cell" :class="renewalClass">{{ renewalDisplay }}</td>
    <td class="table-cell text-center">
      <button
        class="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg border-none cursor-pointer bg-purple-100 text-purple-600 hover:bg-purple-200"
        title="Documents"
        @click="emit('showDocs', item)"
      >{{ item.docCount ?? 0 }}</button>
    </td>
    <td class="table-cell">
      <div class="flex gap-1">
        <button
          class="btn-icon inline-flex items-center justify-center w-7 h-7 text-xs rounded border-none cursor-pointer bg-gray-100 text-gray-600 hover:bg-gray-200"
          title="Edit"
          @click="emit('edit', item)"
        >{{ Icons.edit }}</button>
        <button
          class="btn-icon delete inline-flex items-center justify-center w-7 h-7 text-xs rounded border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
          title="Delete"
          @click="emit('delete', item)"
        >{{ Icons.delete }}</button>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PortfolioItem } from '@models/WealthTrackDataModels';
import { Icons } from '@/constants/icons';
import { isRenewingWithin30Days, formatRenewalDate } from '@composables/useOutgoings';

const props = defineProps<{ item: PortfolioItem }>();
const emit = defineEmits<{
  edit: [item: PortfolioItem];
  delete: [item: PortfolioItem];
  showDocs: [item: PortfolioItem];
}>();

const renewalDisplay = computed(() =>
  props.item.account.renewalDate ? formatRenewalDate(props.item.account.renewalDate) : 'Rolling'
);
const renewingSoon = computed(() => isRenewingWithin30Days(props.item.account.renewalDate));

const monthlyCostDisplay = computed(() => {
  const v = parseFloat(props.item.account.monthlyCost ?? '');
  if (isNaN(v)) return '—';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v);
});

const rowClass = computed(() =>
  renewingSoon.value ? 'border-b border-red-200 bg-red-50' : 'border-b'
);

const renewalClass = computed(() =>
  renewingSoon.value ? 'text-red-600 font-medium' : ''
);
</script>
