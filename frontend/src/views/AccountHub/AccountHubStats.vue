<template>
  <header class="header-panel">
    <div class="header-top">
      <div>
        <h2 class="header-title">Account Hub</h2>
        <p class="header-subtitle">Snapshot of your portfolio with fast actions to add or manage accounts.</p>
      </div>

      <div class="header-actions hidden sm:flex">
        <button class="btn-primary" @click="emitCreateAccount">+ Add Account</button>
        <button class="btn-secondary" @click="emitCreateInstitution">+ Add Institution</button>
        <button class="btn-secondary" @click="emitCreateAccountGroup">+ Account Group</button>
      </div>
    </div>

    <div class="stats-grid">
      <article class="stat-card" :title="getTotalValueTooltip()">
        <p class="stat-label">
          Total Value
          <span class="info-icon" style="cursor: pointer;">{{ Icons.info }}</span>
        </p>
        <p class="stat-value">{{ formatCurrency(totalValue) }}</p>
      </article>

      <article class="stat-card" :title="buildBreakdownTooltip(CASH_TYPES)">
        <p class="stat-label">
          Cash at Hand
          <span class="info-icon" style="cursor: pointer;">{{ Icons.info }}</span>
        </p>
        <p class="stat-value">{{ formatCurrency(cashAtHand) }}</p>
      </article>

      <article class="stat-card" :title="buildBreakdownTooltip(ISA_TYPES)">
        <p class="stat-label">
          ISA Savings
          <span class="info-icon" style="cursor: pointer;">{{ Icons.info }}</span>
        </p>
        <p class="stat-value">{{ formatCurrency(isaSavings) }}</p>
      </article>

      <article class="stat-card" :title="buildBreakdownTooltip(ILLIQUID_TYPES)">
        <p class="stat-label">
          Illiquid
          <span class="info-icon" style="cursor: pointer;">{{ Icons.info }}</span>
        </p>
        <p class="stat-value">{{ formatCurrency(illiquid) }}</p>
      </article>

      <article class="stat-card" :title="buildBreakdownTooltip(TRUST_TYPES)">
        <p class="stat-label">
          Trust Assets
          <span class="info-icon" style="cursor: pointer;">{{ Icons.info }}</span>
        </p>
        <p class="stat-value">{{ formatCurrency(trustAssets) }}</p>
      </article>

      <article class="stat-card" :title="getPensionTooltip()">
        <p class="stat-label">
          Pension Value
          <span class="info-icon" style="cursor: pointer;">{{ Icons.info }}</span>
        </p>
        <p class="stat-value">{{ formatCurrency(pensionBreakdown.total) }}</p>
      </article>

      <article class="stat-card" title="Projected annual yield based on interest rates applied to current balances. Bonus rates are included while active.">
        <p class="stat-label">
          Projected Annual Yield
          <span class="info-icon" style="cursor: pointer;">{{ Icons.info }}</span>
        </p>
        <p class="stat-value">{{ formatCurrency(projectedAnnualYield) }}</p>
      </article>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Icons } from '@/constants/icons';
import type { PortfolioItem } from '@/models/WealthTrackDataModels';
import { type PensionBreakdown, CASH_TYPES, ISA_TYPES, ILLIQUID_TYPES, TRUST_TYPES } from '@composables/portfolioCalculations';

const props = defineProps<{
  totalValue: number;
  cashAtHand: number;
  isaSavings: number;
  illiquid: number;
  trustAssets: number;
  projectedAnnualYield: number;
  pensionBreakdown: PensionBreakdown;
  items: PortfolioItem[];
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

const buildBreakdownTooltip = (types: string[]): string => {
  const totals: Record<string, number> = {};
  for (const item of (props.items ?? [])) {
    const type = item.accountType ?? '';
    if (types.includes(type) && item.latestBalance?.value) {
      totals[type] = (totals[type] ?? 0) + parseFloat(item.latestBalance.value);
    }
  }
  const entries = Object.entries(totals);
  if (!entries.length) return '';
  const lines = entries.map(([t, v]) => `${t}: ${formatCurrency(v)}`);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  lines.push(`─────────────────`);
  lines.push(`Total: ${formatCurrency(total)}`);
  return lines.join('\n');
};

const getTotalValueTooltip = (): string => {
  const totalEncumbrance = (props.items ?? []).reduce((sum, item) => {
    const enc = item.account.encumbrance ? parseFloat(item.account.encumbrance) : 0;
    return sum + (isNaN(enc) ? 0 : enc);
  }, 0);
  const lines = [
    `Cash at Hand: ${formatCurrency(props.cashAtHand)}`,
    `ISA Savings: ${formatCurrency(props.isaSavings)}`,
    `Illiquid: ${formatCurrency(props.illiquid)}`,
    `Trust Assets: ${formatCurrency(props.trustAssets)}`,
    `Pension Value: ${formatCurrency(props.pensionBreakdown.total)}`,
  ];
  if (totalEncumbrance > 0) {
    lines.push(``, `Encumbrances: ${formatCurrency(totalEncumbrance)}`);
  }
  lines.push(``, `Total: ${formatCurrency(props.totalValue)}`);
  return lines.join('\n');
};

const getPensionTooltip = (): string => {
  const { accounts, lifeExpectancy, annuityRate, dcTotal, dbTotal, total } = props.pensionBreakdown;

  if (accounts.length === 0) return 'No pension accounts found.';

  const lines: string[] = [];

  const dcAccounts = accounts.filter(a => a.type === 'DC');
  const dbAccounts = accounts.filter(a => a.type === 'DB');

  if (dcAccounts.length > 0) {
    lines.push('DC Pensions (current balance):');
    for (const a of dcAccounts) {
      lines.push(`  ${a.name} (${a.institution}): ${formatCurrency(a.value)}`);
    }
    lines.push(`  DC Total: ${formatCurrency(dcTotal)}`);
    lines.push('');
  }

  if (dbAccounts.length > 0) {
    const ratePercent = (annuityRate * 100).toFixed(1);
    lines.push('DB Pensions (capitalised value):');
    lines.push(`  Formula: monthly × 12 × (1 − (1+r)⁻ⁿ) / r`);
    lines.push(`  where r = ${ratePercent}% annuity rate, n = ${lifeExpectancy} yrs life expectancy`);
    lines.push('');
    for (const a of dbAccounts) {
      lines.push(`  ${a.name} (${a.institution}): £${a.monthlyPayment?.toFixed(2)}/mo → ${formatCurrency(a.value)}`);
    }
    lines.push(`  DB Total: ${formatCurrency(dbTotal)}`);
    lines.push('');
  }

  lines.push(`Total Pension Value: ${formatCurrency(total)}`);
  return lines.join('\n');
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
