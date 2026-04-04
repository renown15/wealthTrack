<template>
  <tr class="table-row-hover" :class="{ 'bg-red-50': isFixedRateEndingWithin30Days(getFixedRateEndDate(item)) }">
    <td class="table-cell"></td>
    <td class="table-cell">{{ item.institution?.name || 'Unassigned' }}</td>
    <td class="table-cell font-semibold">{{ item.account.name }}</td>
    <td class="table-cell">{{ item.accountType || 'Unknown' }}</td>
    <td class="table-cell">
      <div v-if="editingBalanceId === item.account.id && !isDeferredShares(item) && !isRSU(item) && !isShares(item)" class="balance-edit">
        <input
          :value="editingBalanceValue"
          @input="$emit('update:editingBalanceValue', ($event.target as HTMLInputElement).value)"
          type="text"
          inputmode="decimal"
          class="balance-input form-input py-1 px-2 w-28 text-sm"
          @keydown.enter.prevent="$emit('saveBalance', item.account.id)"
          @keydown.escape="$emit('cancelEdit')"
        />
      </div>
      <button
        v-if="!isDeferredShares(item) && !isRSU(item) && !isShares(item)"
        type="button"
        class="flex items-center gap-1 text-left bg-transparent border-none cursor-pointer group"
        @click.stop="$emit('startEdit', item.account.id, getEditValue(item))"
      >
        <span class="font-semibold text-green-600">{{ formatCurrency(getDisplayBalance(item)) }}</span>
        <span v-if="getEncumbranceTooltip(item)" class="text-orange-500 opacity-70 hover:opacity-100" :title="getEncumbranceTooltip(item)">ℹ️</span>
        <span v-else-if="isDeferredCash(item)" class="text-blue-500 opacity-70 hover:opacity-100" :title="getDeferredTooltip(item)">ℹ️</span>
        <span class="text-muted opacity-0 group-hover:opacity-100 transition-opacity">{{ Icons.edit }}</span>
      </button>
      <div v-else class="flex items-center gap-1">
        <div class="font-semibold text-green-600">{{ formatCurrency(getDisplayBalance(item)) }}</div>
        <span v-if="getEncumbranceTooltip(item)" class="text-orange-500 opacity-70 hover:opacity-100" :title="getEncumbranceTooltip(item)">ℹ️</span>
        <span v-else-if="getDeferredTooltip(item)" class="text-blue-500 opacity-70 hover:opacity-100" :title="getDeferredTooltip(item)">ℹ️</span>
      </div>
    </td>
    <td class="table-cell text-gray-600">{{ formatDate(item.latestBalance?.createdAt) }}</td>
    <td class="table-cell">
      <span class="flex items-center gap-1">
        <span>{{ formatInterestRate(item.account.fixedBonusRate, item.account.interestRate) }}</span>
        <span v-if="getYieldTooltip(item)" class="text-blue-500 opacity-70 hover:opacity-100" :title="getYieldTooltip(item)">ℹ️</span>
      </span>
    </td>
    <td class="table-cell">{{ formatDate(getFixedRateEndDate(item)) }}</td>
    <td class="table-cell">
      <button
        class="btn-events inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
        type="button"
        @click="$emit('showEvents', item)"
      >{{ item.eventCount ?? 0 }}</button>
    </td>
    <td class="table-cell">
      <div class="actions-col">
        <button
          class="btn-icon edit inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
          type="button"
          @click="$emit('editAccount', item.account)"
          title="Edit account"
        >{{ Icons.edit }}</button>
        <button
          class="btn-icon delete inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
          type="button"
          @click="$emit('deleteAccount', item.account)"
          title="Delete account"
        >{{ Icons.delete }}</button>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { Account, PortfolioItem } from '@/models/WealthTrackDataModels';
import {
  isDeferredShares,
  isDeferredCash,
  isRSU,
  isShares,
  getFixedRateEndDate,
  getEditValue,
  getDeferredTooltip,
  getEncumbranceTooltip,
  getDisplayBalance,
  getYieldTooltip,
} from '@views/AccountHub/accountDisplayUtils';
import {
  formatCurrency,
  formatDate,
  formatInterestRate,
} from '@views/AccountHub/formattingUtils';
import { Icons } from '@/constants/icons';

defineProps<{
  item: PortfolioItem;
  editingBalanceId: number | null;
  editingBalanceValue: string;
}>();

defineEmits<{
  saveBalance: [accountId: number];
  cancelEdit: [];
  startEdit: [accountId: number, value: string];
  'update:editingBalanceValue': [value: string];
  showEvents: [item: PortfolioItem];
  editAccount: [account: Account];
  deleteAccount: [account: Account];
}>();

const isFixedRateEndingWithin30Days = (dateStr: string | null | undefined): boolean => {
  if (!dateStr) return false;
  let isoDate = dateStr;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  const endDate = new Date(isoDate);
  if (Number.isNaN(endDate.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  const daysUntil = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntil >= 0 && daysUntil <= 30;
};
</script>
