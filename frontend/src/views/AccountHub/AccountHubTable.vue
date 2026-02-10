<template>
  <section class="accounts-section">
    <header class="table-head">
      <div>
        <p class="eyebrow">Portal Grid</p>
        <h2>Accounts</h2>
        <p class="subtitle">Denormalized view of every account with the latest balance snapshot.</p>
      </div>
      <button class="btn btn-primary" type="button" @click="emitAddAccount">+ADD ACCOUNT</button>
    </header>

    <div class="table-wrapper">
      <table class="account-table">
        <thead>
          <tr>
            <th>Institution</th>
            <th>Account Name</th>
            <th>Account Type</th>
            <th>Latest Balance</th>
            <th>Events</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.account.id">
            <td>{{ item.institution?.name || 'Unassigned' }}</td>
            <td>{{ item.account.name }}</td>
            <td>{{ item.accountType || 'Unknown' }}</td>
            <td>{{ formatCurrency(item.latestBalance?.value) }}</td>
            <td>
              <button
                class="btn btn-secondary btn-events"
                type="button"
                @click="emitShowEvents(item.account.id, item.account.name, item.eventCount ?? 0)"
              >
                {{ item.eventCount ?? 0 }} Events
              </button>
            </td>
            <td class="actions-col">
              <button class="btn-icon edit" type="button" @click="emitEdit(item.account)" title="Edit account">✎</button>
              <button
                class="btn-icon delete"
                type="button"
                @click="emitDelete('account', item.account.id, item.account.name)"
                title="Delete account"
              >
                ✕
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Account, PortfolioItem } from '@/models/Portfolio';

defineProps<{
  items: PortfolioItem[];
}>();

const emit = defineEmits<{
  editAccount: [account: Account];
  deleteItem: [type: 'account' | 'institution', id: number, name: string];
  showEvents: [accountId: number, accountName: string, eventCount: number];
  addAccount: [];
}>();

const formatCurrency = (value?: string | number | null): string => {
  if (!value) return '—';
  const numeric = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(numeric)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numeric);
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

const emitAddAccount = (): void => {
  emit('addAccount');
};
</script>

<style scoped src="@/styles/PortfolioView.css"></style>
