<template>
  <header class="header-panel">
    <div class="header-top">
      <div>
        <h2 class="header-title">Account Hub</h2>
        <p class="header-subtitle">Snapshot of your portfolio with fast actions to add or manage accounts.</p>
      </div>

      <div class="header-actions">
        <button class="btn-primary" @click="emitCreateAccount">+ Add Account</button>
        <button class="btn-secondary" @click="emitCreateInstitution">+ Add Institution</button>
      </div>
    </div>

    <div class="stats-grid">
      <article class="stat-card">
        <p class="stat-label">Total Value</p>
        <p class="stat-value">{{ formatCurrency(totalValue) }}</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">Accounts</p>
        <p class="stat-value">{{ accountCount }}</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">Institutions</p>
        <p class="stat-value">{{ institutionCount }}</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">Events</p>
        <p class="stat-value">{{ eventCount }}</p>
      </article>
    </div>
  </header>
</template>

<script setup lang="ts">
const props = defineProps<{
  totalValue: number;
  accountCount: number;
  institutionCount: number;
  eventCount: number;
}>();

const emit = defineEmits<{
  createAccount: [];
  createInstitution: [];
}>();

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(value);
};

const emitCreateAccount = (): void => {
  emit('createAccount');
};

const emitCreateInstitution = (): void => {
  emit('createInstitution');
};
</script>

<!-- Uses UnoCSS utilities via shortcuts -->
