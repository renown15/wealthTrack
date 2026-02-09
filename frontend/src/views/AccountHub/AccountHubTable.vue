<template>
  <section class="accounts-section">
    <h2>Accounts</h2>
    <div class="accounts-grid">
      <article v-for="item in items" :key="item.account.id" class="account-card">
        <header class="account-header">
          <h3>{{ item.account.name }}</h3>
          <div class="account-actions">
            <button
              class="btn-icon edit"
              @click="emitEdit(item.account)"
              title="Edit account"
            >
              ✎
            </button>
            <button
              class="btn-icon delete"
              @click="emitDelete('account', item.account.id, item.account.name)"
              title="Delete account"
            >
              ✕
            </button>
          </div>
        </header>

        <div class="account-body">
          <div class="account-info">
            <span class="label">Institution</span>
            <span class="value">{{ item.institution?.name || 'None' }}</span>
          </div>

          <div class="account-info">
            <span class="label">Balance</span>
            <span class="value balance">{{ formatCurrency(item.latestBalance?.value) }}</span>
          </div>

          <div class="account-info">
            <span class="label">Last Updated</span>
            <span class="value">{{
              item.latestBalance?.createdAt
                ? formatDate(item.latestBalance.createdAt)
                : 'Never'
            }}</span>
          </div>
        </div>
      </article>
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
}>();

const formatCurrency = (value?: string | number): string => {
  if (!value) return '$0.00';
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  } catch {
    return '$0.00';
  }
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString();
};

const emitEdit = (account: Account): void => {
  emit('editAccount', account);
};

const emitDelete = (type: 'account' | 'institution', id: number, name: string): void => {
  emit('deleteItem', type, id, name);
};
</script>

<style scoped src="@/styles/PortfolioView.css"></style>
