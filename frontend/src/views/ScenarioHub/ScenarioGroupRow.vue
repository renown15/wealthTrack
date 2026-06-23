<template>
  <tr
    class="table-row-hover cursor-grab active:cursor-grabbing"
    draggable="true"
    @dragstart="emit('dragStart', account.accountId)"
  >
    <td class="table-cell font-semibold">
      <div class="flex items-center gap-2">
        <span
          v-if="account.ownerInitials"
          class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex-shrink-0"
          :title="account.ownerInitials"
        >{{ account.ownerInitials }}</span>
        {{ account.name }}
      </div>
    </td>
    <td class="table-cell text-muted">{{ account.institutionName || '—' }}</td>
    <td class="table-cell text-muted">{{ account.accountType || '—' }}</td>
    <td class="table-cell text-right font-mono">{{ formattedBalance }}</td>
    <td v-if="isOwner" class="table-cell">
      <div class="actions-col">
        <button
          class="btn-icon-delete"
          title="Remove from group"
          style="width:1.75rem;height:1.75rem;font-size:0.75rem;"
          @click="emit('unassign', account.accountId)"
        >{{ Icons.delete }}</button>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ScenarioAccountItem } from '@models/scenario';
import { Icons } from '@/constants/icons';

const props = defineProps<{
  account: ScenarioAccountItem;
  balanceMap: Record<number, number>;
  isOwner: boolean;
}>();

const emit = defineEmits<{
  dragStart: [accountId: number];
  unassign: [accountId: number];
}>();

const formattedBalance = computed(() => {
  const val = props.balanceMap[props.account.accountId];
  if (val === undefined || val === null) return '—';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val);
});
</script>
