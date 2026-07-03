<template>
  <header class="header-panel">
    <div class="header-top">
      <div>
        <h2 class="header-title">Outgoings Hub</h2>
        <p class="header-subtitle">Track utilities, insurance, and subscriptions in one place.</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="emit('addProvider')">+ Add Provider</button>
        <button class="btn-primary" @click="emit('addAccount')">+ Add Outgoing</button>
      </div>
    </div>

    <div class="stats-grid">
      <article class="stat-card">
        <p class="stat-label">Monthly Cost</p>
        <p class="stat-value">{{ formatGbp(stats.totalMonthlyGbp) }}</p>
      </article>
      <article class="stat-card">
        <p class="stat-label">Annual Cost</p>
        <p class="stat-value">{{ formatGbp(stats.totalAnnualGbp) }}</p>
      </article>
      <article class="stat-card" :class="stats.renewingSoonCount > 0 ? 'red-card' : ''">
        <p class="stat-label">Renewing Within 30 Days</p>
        <p class="stat-value">{{ stats.renewingSoonCount }}</p>
      </article>
      <article class="stat-card">
        <p class="stat-label">Total Outgoings</p>
        <p class="stat-value">{{ totalCount }}</p>
      </article>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { OutgoingsStats } from '@composables/useOutgoings';

defineProps<{
  stats: OutgoingsStats;
  totalCount: number;
}>();

const emit = defineEmits<{ addAccount: []; addProvider: [] }>();

function formatGbp(value: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(value);
}
</script>
