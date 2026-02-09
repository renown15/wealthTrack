<template>
  <header class="portfolio-header">
    <div class="header-content">
      <h1>Portfolio Dashboard</h1>
      <div class="header-stats">
        <div class="stat">
          <span class="stat-label">Total Value</span>
          <span class="stat-value">{{ formatCurrency(totalValue) }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Accounts</span>
          <span class="stat-value">{{ accountCount }}</span>
        </div>
      </div>
    </div>

    <div class="header-actions">
      <button class="btn btn-primary" @click="emitCreateAccount">+ New Account</button>
      <button class="btn btn-secondary" @click="emitCreateInstitution">+ New Institution</button>
    </div>
  </header>
</template>

<script setup lang="ts">
const props = defineProps<{
  totalValue: number;
  accountCount: number;
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
