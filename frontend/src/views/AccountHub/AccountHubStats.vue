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
      <article class="stat-card">
        <p class="stat-label">
          Total Value
          <InfoBadge subtle :text="getTotalValueTooltip()" />
        </p>
        <p class="stat-value">{{ formatCurrency(totalValue) }}</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">
          Cash at Hand
          <InfoBadge subtle :text="buildBreakdownTooltip(CASH_TYPES)" />
        </p>
        <p class="stat-value">{{ formatCurrency(cashAtHand) }}</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">
          ISA Savings
          <InfoBadge subtle :text="buildBreakdownTooltip(ISA_TYPES)" />
        </p>
        <p class="stat-value">{{ formatCurrency(isaSavings) }}</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">
          Illiquid
          <InfoBadge subtle :text="buildBreakdownTooltip(ILLIQUID_TYPES)" />
        </p>
        <p class="stat-value">{{ formatCurrency(illiquid) }}</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">
          Trust Assets
          <InfoBadge subtle :text="buildBreakdownTooltip(TRUST_TYPES)" />
        </p>
        <p class="stat-value">{{ formatCurrency(trustAssets) }}</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">
          Encumbrances + Tax
          <InfoBadge subtle :text="getEncumbranceTooltip()" />
        </p>
        <p class="stat-value">{{ formatCurrency(totalEncumbrances() + props.totalTax) }}</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">
          Pension Value
          <InfoBadge subtle :text="getPensionTooltip()" />
        </p>
        <p class="stat-value">{{ formatCurrency(pensionBreakdown.total) }}</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">
          Projected Annual Yield
          <InfoBadge subtle :text="getProjectedYieldTooltip()" />
        </p>
        <p class="stat-value">{{ formatCurrency(projectedAnnualYield) }}</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">
          Last Price Update
          <InfoBadge subtle :text="getLastPriceUpdateTooltip()" />
        </p>
        <p class="stat-value text-sm">{{ formatLastPriceUpdate(lastPriceUpdate) }}</p>
      </article>
    </div>
  </header>
</template>

<script setup lang="ts">
import InfoBadge from '@views/AccountHub/InfoBadge.vue';
import type { PortfolioItem } from '@/models/WealthTrackDataModels';
import { type PensionBreakdown, CASH_TYPES, ISA_TYPES, ILLIQUID_TYPES, TRUST_TYPES } from '@composables/portfolioCalculations';

const props = defineProps<{
  totalValue: number;
  cashAtHand: number;
  isaSavings: number;
  illiquid: number;
  trustAssets: number;
  totalTax: number;
  projectedAnnualYield: number;
  pensionBreakdown: PensionBreakdown;
  items: PortfolioItem[];
  lastPriceUpdate?: string | null;
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

const totalEncumbrances = (): number =>
  (props.items ?? []).reduce((s, i) => s + (i.account.encumbrance ? parseFloat(i.account.encumbrance) : 0), 0);

const getEncumbranceTooltip = (): string => {
  const enc = (props.items ?? []).filter(i => parseFloat(i.account.encumbrance ?? '0') > 0);
  return [...enc.map(i => `Enc ${i.account.name}: ${formatCurrency(parseFloat(i.account.encumbrance!))}`), `Tax owed: ${formatCurrency(props.totalTax)}`, '─────────────────', `Total: ${formatCurrency(totalEncumbrances() + props.totalTax)}`].join('\n');
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
  if (!entries.length) return 'Status: No accounts';
  const lines = entries.map(([t, v]) => `${t}: ${formatCurrency(v)}`);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  lines.push(`─────────────────`);
  lines.push(`Total: ${formatCurrency(total)}`);
  return lines.join('\n');
};

const getTotalValueTooltip = (): string => {
  const lines = [`Cash at Hand: ${formatCurrency(props.cashAtHand)}`];
  if (props.totalTax > 0) {
    const afterTax = props.cashAtHand - props.totalTax;
    lines.push(`Tax owed: ${formatCurrency(-props.totalTax)}`, `Subtotal: ${formatCurrency(afterTax)}`);
  }
  lines.push(
    `ISA Savings: ${formatCurrency(props.isaSavings)}`,
    `Illiquid: ${formatCurrency(props.illiquid)}`,
    `Trust Assets: ${formatCurrency(props.trustAssets)}`,
    `Pension Value: ${formatCurrency(props.pensionBreakdown.total)}`,
    `─────────────────`,
    `Total: ${formatCurrency(props.totalValue)}`);
  return lines.join('\n');
};

const getPensionTooltip = (): string => {
  const { accounts, lifeExpectancy, annuityRate, dcTotal, dbTotal, total } = props.pensionBreakdown;
  if (accounts.length === 0) return 'Status: No pension accounts';
  const lines: string[] = [];
  const dcAccounts = accounts.filter(a => a.type === 'DC');
  const dbAccounts = accounts.filter(a => a.type === 'DB');
  if (dcAccounts.length > 0) {
    lines.push('DC Pensions: current balance');
    for (const a of dcAccounts) lines.push(`${a.name} (${a.institution}): ${formatCurrency(a.value)}`);
    lines.push(`DC Total: ${formatCurrency(dcTotal)}`);
    if (dbAccounts.length > 0) lines.push('─────────────────');
  }
  if (dbAccounts.length > 0) {
    const ratePercent = (annuityRate * 100).toFixed(1);
    lines.push('DB Pensions: capitalised value');
    lines.push(`Formula: monthly × 12 × (1 − (1+r)⁻ⁿ) / r`);
    lines.push(`Rate / Life: ${ratePercent}% annuity, ${lifeExpectancy} yrs`);
    for (const a of dbAccounts) lines.push(`${a.name} (${a.institution}): £${a.monthlyPayment?.toFixed(2)}/mo → ${formatCurrency(a.value)}`);
    lines.push(`DB Total: ${formatCurrency(dbTotal)}`);
  }
  lines.push('─────────────────', `Total: ${formatCurrency(total)}`);
  return lines.join('\n');
};

const formatLastPriceUpdate = (timestamp: string | null | undefined): string => {
  if (!timestamp) return 'Never';
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return timestamp;
  }
};

const getProjectedYieldTooltip = (): string =>
  'Calculation: Interest rates × current balances\nBonus rates: Included while active';

const getLastPriceUpdateTooltip = (): string =>
  'Source: Most recent stock price or balance update\nScope: All accounts';

const emitCreateAccount = (): void => emit('createAccount');
const emitCreateInstitution = (): void => emit('createInstitution');
const emitCreateAccountGroup = (): void => emit('createAccountGroup');
</script>

<!-- Uses UnoCSS utilities via shortcuts -->
