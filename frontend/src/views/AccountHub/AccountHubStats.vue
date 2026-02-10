<template>
  <header class="portfolio-header stats-header">
    <div class="header-flex">
      <div class="header-content">
        <p class="eyebrow">WealthTrack</p>
        <h1>Account Hub</h1>
        <p class="subtitle">Snapshot of your portfolio with fast actions to add or manage accounts.</p>
      </div>

      <div class="header-actions">
        <button class="btn btn-primary" @click="emitCreateAccount">+ ADD ACCOUNT</button>
        <button class="btn btn-secondary" @click="emitCreateInstitution">+ ADD INSTITUTION</button>
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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const emitCreateAccount = (): void => {
  emit('createAccount');
};

const emitCreateInstitution = (): void => {
  emit('createInstitution');
};
</script>

<style scoped src="@/styles/PortfolioView.css"></style>
