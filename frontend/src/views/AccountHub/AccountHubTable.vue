<template>
  <section>
    <div class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th class="table-cell table-header text-left cursor-pointer hover:bg-gray-200" @click="setSortBy('institution')">
              Institution
              <span v-if="sortBy === 'institution'" class="ml-1">{{ sortDirection === 'asc' ? Icons.sortAsc : Icons.sortDesc }}</span>
            </th>
            <th class="table-cell table-header text-left cursor-pointer hover:bg-gray-200" @click="setSortBy('accountName')">
              Account Name
              <span v-if="sortBy === 'accountName'" class="ml-1">{{ sortDirection === 'asc' ? Icons.sortAsc : Icons.sortDesc }}</span>
            </th>
            <th class="table-cell table-header text-left cursor-pointer hover:bg-gray-200" @click="setSortBy('accountType')">
              Account Type
              <span v-if="sortBy === 'accountType'" class="ml-1">{{ sortDirection === 'asc' ? Icons.sortAsc : Icons.sortDesc }}</span>
            </th>
            <th class="table-cell table-header text-left cursor-pointer hover:bg-gray-200" @click="setSortBy('balance')">
              Latest Balance
              <span v-if="sortBy === 'balance'" class="ml-1">{{ sortDirection === 'asc' ? Icons.sortAsc : Icons.sortDesc }}</span>
            </th>
            <th class="table-cell table-header text-left cursor-pointer hover:bg-gray-200" @click="setSortBy('balanceUpdated')">
              Balance Updated
              <span v-if="sortBy === 'balanceUpdated'" class="ml-1">{{ sortDirection === 'asc' ? Icons.sortAsc : Icons.sortDesc }}</span>
            </th>
            <th class="table-cell table-header text-left cursor-pointer hover:bg-gray-200" @click="setSortBy('interestRate')">
              Interest Rate
              <span v-if="sortBy === 'interestRate'" class="ml-1">{{ sortDirection === 'asc' ? Icons.sortAsc : Icons.sortDesc }}</span>
            </th>
            <th class="table-cell table-header text-left cursor-pointer hover:bg-gray-200" @click="setSortBy('fixedRateEnd')">
              Fixed Rate End
              <span v-if="sortBy === 'fixedRateEnd'" class="ml-1">{{ sortDirection === 'asc' ? Icons.sortAsc : Icons.sortDesc }}</span>
            </th>
            <th class="table-cell table-header text-left">Events</th>
            <th class="table-cell table-header text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in sortedItems" :key="item.account.id" class="table-row-hover" :class="{ 'bg-red-50': isFixedRateEndingWithin30Days(getFixedRateEndDate(item)) }">
            <td class="table-cell">{{ item.institution?.name || 'Unassigned' }}</td>
            <td class="table-cell font-semibold">{{ item.account.name }}</td>
            <td class="table-cell">{{ item.accountType || 'Unknown' }}</td>
            <td class="table-cell">
              <div v-if="editingBalanceId === item.account.id && !isDeferredShares(item) && !isRSU(item)" class="balance-edit">
                <input
                  v-model="editingBalanceValue"
                  type="text"
                  inputmode="decimal"
                  class="balance-input form-input py-1 px-2 w-28 text-sm"
                  @keydown.enter.prevent="saveBalance(item.account.id)"
                  @keydown.escape="cancelEdit"
                />
              </div>
              <button
                v-if="!isDeferredShares(item) && !isRSU(item)"
                type="button"
                class="flex items-center gap-1 text-left bg-transparent border-none cursor-pointer group"
                :title="isDeferredCash(item) ? getDeferredTooltip(item) : undefined"
                @click.stop="startEdit(item.account.id, getEditValue(item))"
              >
                <span class="font-semibold text-green-600">{{ formatCurrency(getDisplayBalance(item)) }}</span>
                <span v-if="isDeferredCash(item)" class="text-blue-500 opacity-70 hover:opacity-100" :title="getDeferredTooltip(item)">{{ Icons.info }}</span>
                <span class="text-muted opacity-0 group-hover:opacity-100 transition-opacity">{{ Icons.edit }}</span>
              </button>
              <div
                v-else
                class="flex items-center gap-1"
              >
                <div
                  :title="getDeferredTooltip(item)"
                  class="font-semibold text-green-600"
                >
                  {{ formatCurrency(getDisplayBalance(item)) }}
                </div>
                <span v-if="getDeferredTooltip(item)" class="text-blue-500 opacity-70 hover:opacity-100" :title="getDeferredTooltip(item)">{{ Icons.info }}</span>
              </div>
            </td>
            <td class="table-cell text-gray-600">
              {{ formatDate(item.latestBalance?.createdAt) }}
            </td>
            <td class="table-cell">
              {{ formatInterestRate(item.account.fixedBonusRate, item.account.interestRate) }}
            </td>
            <td class="table-cell">
              {{ formatDate(getFixedRateEndDate(item)) }}
            </td>
            <td class="table-cell">
              <button
                class="btn-events inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                type="button"
                @click="emitShowEvents(item.account.id, item.account.name, item.eventCount ?? 0)"
              >
                {{ item.eventCount ?? 0 }}
              </button>
            </td>
            <td class="table-cell">
              <div class="actions-col">
                <button
                  class="btn-icon edit inline-flex items-center justify-center w-9 h-9 text-lg rounded-lg border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                  type="button"
                  @click="emitEdit(item.account)"
                  title="Edit account"
                >{{ Icons.edit }}</button>
                <button
                  class="btn-icon delete inline-flex items-center justify-center w-9 h-9 text-lg rounded-lg border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
                  type="button"
                  @click="emitDelete('account', item.account.id, item.account.name)"
                  title="Delete account"
                >{{ Icons.delete }}</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Account, PortfolioItem } from '@/models/WealthTrackDataModels';
import { Icons } from '@/constants/icons';
import {
  isDeferredShares,
  isDeferredCash,
  isRSU,
  getFixedRateEndDate,
  getEditValue,
  getDeferredTooltip,
  getDisplayBalance,
} from '@views/AccountHub/accountDisplayUtils';
import {
  formatCurrency,
  formatDate,
  formatInterestRate,
} from '@views/AccountHub/formattingUtils';
import { useTableSorting } from '@views/AccountHub/useTableSorting';
import { useBalanceEditing } from '@views/AccountHub/useBalanceEditing';

const props = defineProps<{
  items: PortfolioItem[];
}>();

const emit = defineEmits<{
  editAccount: [account: Account];
  deleteItem: [type: 'account' | 'institution', id: number, name: string];
  showEvents: [accountId: number, accountName: string, eventCount: number];
  updateBalance: [accountId: number, value: string];
}>();

const { sortBy, sortDirection, setSortBy, sortedItems } = useTableSorting(props.items);
const { editingBalanceId, editingBalanceValue, startEdit, cancelEdit, saveBalance } = useBalanceEditing();

const isFixedRateEndingWithin30Days = (dateStr: string | null | undefined): boolean => {
  if (!dateStr) return false;

  let isoDate = dateStr;
  if (dateStr.includes('/')) {
    // Convert DD/MM/YYYY to YYYY-MM-DD
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

const emitEdit = (account: Account): void => {
  emit('editAccount', account);
};

const emitDelete = (type: 'account' | 'institution', id: number, name: string): void => {
  emit('deleteItem', type, id, name);
};

const emitShowEvents = (accountId: number, accountName: string, eventCount: number): void => {
  emit('showEvents', accountId, accountName, eventCount);
};
</script>

<!-- Uses UnoCSS utilities via shortcuts -->
