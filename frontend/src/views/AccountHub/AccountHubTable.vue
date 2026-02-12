<template>
  <section>
    <div class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th class="table-cell table-header text-left">Institution</th>
            <th class="table-cell table-header text-left">Account Name</th>
            <th class="table-cell table-header text-left">Account Type</th>
            <th class="table-cell table-header text-left">Opened</th>
            <th class="table-cell table-header text-left">Closed</th>
            <th class="table-cell table-header text-left">Latest Balance</th>
            <th class="table-cell table-header text-left">Balance Updated</th>
            <th class="table-cell table-header text-left">Interest Rate</th>
            <th class="table-cell table-header text-left">Events</th>
            <th class="table-cell table-header text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.account.id" class="table-row-hover">
            <td class="table-cell">{{ item.institution?.name || 'Unassigned' }}</td>
            <td class="table-cell font-semibold">{{ item.account.name }}</td>
            <td class="table-cell">{{ item.accountType || 'Unknown' }}</td>
            <td class="table-cell">{{ formatDate(item.account.openedAt) }}</td>
            <td class="table-cell">{{ formatDate(item.account.closedAt) }}</td>
            <td class="table-cell">
              <div v-if="editingBalanceId === item.account.id" class="balance-edit">
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
                v-else
                type="button"
                class="flex items-center gap-1 text-left bg-transparent border-none cursor-pointer group"
                @click.stop="startEdit(item.account.id, item.latestBalance?.value)"
                title="Click to edit balance"
              >
                <span class="font-semibold text-green-600">{{ formatCurrency(item.latestBalance?.value) }}</span>
                <span class="text-muted opacity-0 group-hover:opacity-100 transition-opacity">{{ Icons.edit }}</span>
              </button>
            </td>
            <td class="table-cell text-gray-600">
              {{ formatDate(item.latestBalance?.createdAt) }}
            </td>
            <td class="table-cell">
              {{ item.account.interestRate || '—' }}
            </td>
            <td class="table-cell">
              <button
                class="btn-events inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                type="button"
                @click="emitShowEvents(item.account.id, item.account.name, item.eventCount ?? 0)"
              >
                {{ item.eventCount ?? 0 }} Events
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
import { ref, nextTick, onMounted, onUnmounted } from 'vue';
import type { Account, PortfolioItem } from '@/models/WealthTrackDataModels';
import { Icons } from '@/constants/icons';

defineProps<{
  items: PortfolioItem[];
}>();

const emit = defineEmits<{
  editAccount: [account: Account];
  deleteItem: [type: 'account' | 'institution', id: number, name: string];
  showEvents: [accountId: number, accountName: string, eventCount: number];
  updateBalance: [accountId: number, value: string];
}>();

const editingBalanceId = ref<number | null>(null);
const editingBalanceValue = ref('');

const formatCurrency = (value?: string | number | null): string => {
  if (!value) return '—';
  const numeric = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(numeric)) return '—';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(numeric);
};

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const startEdit = (accountId: number, currentValue?: string | number | null): void => {
  editingBalanceId.value = accountId;
  const numeric = currentValue
    ? typeof currentValue === 'string'
      ? parseFloat(currentValue)
      : currentValue
    : 0;
  editingBalanceValue.value = Number.isNaN(numeric) ? '0' : numeric.toString();
  nextTick(() => {
    const input = document.querySelector('.balance-input') as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  });
};

const cancelEdit = (): void => {
  editingBalanceId.value = null;
  editingBalanceValue.value = '';
};

const handleClickOutside = (event: MouseEvent): void => {
  if (editingBalanceId.value === null) return;
  const target = event.target as HTMLElement;
  if (!target.closest('.balance-edit')) {
    cancelEdit();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const saveBalance = (accountId: number): void => {
  console.log('saveBalance called', { accountId, editingBalanceId: editingBalanceId.value, value: editingBalanceValue.value });
  if (editingBalanceId.value !== accountId) return;
  const value = editingBalanceValue.value.trim();
  if (value && !Number.isNaN(parseFloat(value))) {
    console.log('emitting updateBalance', { accountId, value });
    emit('updateBalance', accountId, value);
  }
  cancelEdit();
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
