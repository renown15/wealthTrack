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
        <button class="btn-secondary" @click="emitCreateAccountGroup">+ Account Group</button>
      </div>
    </div>

    <div class="stats-grid">
      <article class="stat-card" :title="getTotalValueTooltip()">
        <p class="stat-label">
          Total Value
          <span class="info-icon" style="cursor: help;">{{ Icons.info }}</span>
        </p>
        <p class="stat-value">{{ formatCurrency(totalValue) }}</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">Cash at Hand</p>
        <p class="stat-value">{{ formatCurrency(cashAtHand) }}</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">ISA Savings</p>
        <p class="stat-value">{{ formatCurrency(isaSavings) }}</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">Illiquid</p>
        <p class="stat-value">{{ formatCurrency(illiquid) }}</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">Trust Assets</p>
        <p class="stat-value">{{ formatCurrency(trustAssets) }}</p>
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

      <article class="stat-card" title="Projected annual yield based on interest rates applied to current balances. Bonus rates are included while active.">
        <p class="stat-label">
          Projected Annual Yield
          <span class="info-icon" style="cursor: help;">{{ Icons.info }}</span>
        </p>
        <p class="stat-value">{{ formatCurrency(projectedAnnualYield) }}</p>
      </article>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Icons } from '@/constants/icons';

const props = defineProps<{
  totalValue: number;
  accountCount: number;
  institutionCount: number;
  eventCount: number;
  cashAtHand: number;
  isaSavings: number;
  illiquid: number;
  trustAssets: number;
  projectedAnnualYield: number;
}>();

const emit = defineEmits<{
  createAccount: [];
  createInstitution: [];
  createAccountGroup: [];
}>();

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(value);
};

const getTotalValueTooltip = (): string => {
  const breakdown = [
    `Cash at Hand: ${formatCurrency(props.cashAtHand)}`,
    `ISA Savings: ${formatCurrency(props.isaSavings)}`,
    `Illiquid: ${formatCurrency(props.illiquid)}`,
    ``,
    `Total: ${formatCurrency(props.totalValue)}`,
  ];
  return breakdown.join('\n');
};

const getTrustAssetsTooltip = (): string => {
  const breakdown = [
    `Trust Bank Account: ${formatCurrency(props.cashAtHand)}`,
    `Trust Stocks Investment: ${formatCurrency(props.isaSavings)}`,
    ``,
    `Total Trust Assets: ${formatCurrency(props.trustAssets)}`,
  ];
  return breakdown.join('\n');
};

const emitCreateAccount = (): void => {
  emit('createAccount');
};

const emitCreateInstitution = (): void => {
  emit('createInstitution');
};

const emitCreateAccountGroup = (): void => {
  emit('createAccountGroup');
};
</script>

<!-- Uses UnoCSS utilities via shortcuts -->
