<template>
  <!-- Group header row -->
  <tr class="table-row-hover cursor-pointer group-row" @click="$emit('toggleGroup', groupId)">
      <td class="table-cell text-center">
        <span class="inline-block transition-transform" :class="{ 'rotate-90': isExpanded }">
          ▶
        </span>
      </td>
      <td class="table-cell">{{ summary?.commonInstitution || '—' }}</td>
      <td class="table-cell font-semibold">
        <span v-if="!summary?.namesMatch" class="flex items-center justify-between gap-2">
          <span>📁 {{ name }}</span>
          <span class="inline-flex items-center px-2 py-1 text-xs font-600 bg-blue-100 text-blue-700 rounded">{{ items.length }}</span>
        </span>
        <span v-else class="flex items-center justify-between gap-2">
          <span>{{ items[0]?.account.name || '—' }}</span>
          <span class="inline-flex items-center px-2 py-1 text-xs font-600 bg-blue-100 text-blue-700 rounded">{{ items.length }}</span>
        </span>
      </td>
      <td class="table-cell">{{ summary?.commonAccountType || '—' }}</td>
      <td class="table-cell font-semibold text-green-700">
        <span class="flex items-center gap-1">
          <span>{{ formatCurrency(summary?.totalBalance || 0) }}</span>
          <span v-if="groupDeferredTooltip" class="inline-flex items-center justify-center w-4 h-4 text-xs font-bold rounded bg-blue-100 text-blue-600 cursor-pointer flex-shrink-0" :title="groupDeferredTooltip">i</span>
          <span v-if="groupEncumbranceTooltip" class="inline-flex items-center justify-center w-4 h-4 text-xs font-bold rounded bg-blue-100 text-blue-600 cursor-pointer flex-shrink-0" :title="groupEncumbranceTooltip">i</span>
        </span>
      </td>
      <td class="table-cell">{{ summary?.commonBalanceUpdatedAt ? formatDate(summary.commonBalanceUpdatedAt) : '—' }}</td>
      <td class="table-cell">
        <span class="flex items-center gap-1">
          <span>{{ summary?.commonBonusRate !== null && summary?.commonInterestRate !== null
            ? formatInterestRate(summary?.commonBonusRate, summary?.commonInterestRate)
            : '—' }}</span>
          <span v-if="groupYieldTooltip" class="inline-flex items-center justify-center w-4 h-4 text-xs font-bold rounded bg-blue-100 text-blue-600 cursor-pointer flex-shrink-0" :title="groupYieldTooltip">i</span>
        </span>
      </td>
      <td class="table-cell">{{ summary?.commonEndDate ? formatDate(summary.commonEndDate) : '—' }}</td>
      <td class="table-cell">
        <span v-if="(summary?.totalEvents || 0) > 0" class="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold rounded-lg bg-blue-100 text-blue-600">
          {{ summary?.totalEvents ?? 0 }}
        </span>
        <span v-else class="text-gray-400">—</span>
      </td>
      <td class="table-cell"><!-- docs --></td>
      <td class="table-cell text-right">
        <div class="flex items-center justify-end gap-1">
          <button
            class="btn-icon edit inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
            type="button"
            @click.stop="$emit('editGroup', groupId, name)"
            title="Edit group"
          >{{ Icons.edit }}</button>
          <button
            class="btn-icon delete inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
            type="button"
            @click.stop="$emit('deleteGroup', groupId)"
            title="Delete group"
          >{{ Icons.delete }}</button>
        </div>
      </td>
    </tr>
    <!-- Group member rows -->
    <PortfolioTableMemberRow
      v-for="(item, idx) in items"
      v-show="isExpanded"
      :key="`member-${item.account.id}`"
      :item="item"
      :is-first="idx === 0"
      :editing-balance-id="editingBalanceId"
      :editing-balance-value="editingBalanceValue"
      @save-balance="$emit('saveBalance', $event)"
      @cancel-edit="$emit('cancelEdit')"
      @start-edit="(id, val) => $emit('startEdit', id, val)"
      @update:editingBalanceValue="$emit('update:editingBalanceValue', $event)"
      @show-events="$emit('showEvents', $event)"
      @show-docs="$emit('showDocs', $event)"
      @edit-account="$emit('editAccount', $event)"
      @delete-account="$emit('deleteAccount', $event)"
    />
</template>

<script setup lang="ts">
import type { Account, PortfolioItem } from '@/models/WealthTrackDataModels';
import { formatCurrency, formatDate, formatInterestRate } from '@views/AccountHub/formattingUtils';
import { getGroupYieldTooltip, getGroupDeferredTooltip, getGroupEncumbranceTooltip } from '@views/AccountHub/accountDisplayUtils';
import { Icons } from '@/constants/icons';
import { computed } from 'vue';
import PortfolioTableMemberRow from '@views/AccountHub/PortfolioTableMemberRow.vue';

interface GroupSummary {
  totalBalance: number;
  commonInstitution: string | null | undefined;
  commonAccountType: string | null | undefined;
  commonInterestRate: string | number | null | undefined;
  commonBonusRate: string | number | null | undefined;
  commonEndDate: string | null | undefined;
  commonBalanceUpdatedAt: string | undefined;
  totalEvents: number;
  namesMatch: boolean;
}

const props = defineProps<{
  groupId: number;
  name: string;
  items: PortfolioItem[];
  summary: GroupSummary | null;
  isExpanded: boolean;
  editingBalanceId: number | null;
  editingBalanceValue: string;
}>();

defineEmits<{
  toggleGroup: [groupId: number];
  editGroup: [groupId: number, name: string];
  deleteGroup: [groupId: number];
  saveBalance: [accountId: number];
  cancelEdit: [];
  startEdit: [accountId: number, value: string];
  'update:editingBalanceValue': [value: string];
  showEvents: [item: PortfolioItem];
  showDocs: [item: PortfolioItem];
  editAccount: [account: Account];
  deleteAccount: [account: Account];
}>();

const groupYieldTooltip = computed(() => getGroupYieldTooltip(props.items));
const groupDeferredTooltip = computed(() => getGroupDeferredTooltip(props.items));
const groupEncumbranceTooltip = computed(() => getGroupEncumbranceTooltip(props.items));
</script>
