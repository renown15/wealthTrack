<template>
  <div class="page-view">
    <div class="hub-header-card">
      <div class="header-panel">
        <div class="header-top">
          <div>
            <h2 class="header-title">Analytics</h2>
            <p class="header-subtitle">Portfolio performance and composition</p>
          </div>
        </div>
        <div v-if="!loading && breakdown" class="stats-grid">
          <article class="stat-card">
            <p class="stat-label">
              Total Value
              <button class="text-xs text-blue-500 hover:text-blue-700 underline ml-1 bg-transparent border-none cursor-pointer p-0" title="Download account balances as CSV" @click="downloadCsv">&#8595; CSV</button>
            </p>
            <p class="stat-value">{{ formatCurrency(breakdown.total) }}</p>
          </article>
          <article class="stat-card">
            <p class="stat-label">Accounts</p>
            <p class="stat-value">{{ totalAccounts }}</p>
          </article>
          <article class="stat-card">
            <p class="stat-label">Institutions</p>
            <p class="stat-value">{{ breakdown.byInstitution.length }}</p>
          </article>
        </div>
      </div>
    </div>

    <div v-if="error" class="hub-content-card p-6">
      <div class="error-banner">
        <span>{{ error }}</span>
        <button class="btn-close" @click="error = null">×</button>
      </div>
    </div>

    <div v-if="loading" class="hub-content-card p-8 loading-state">
      <div class="flex flex-col items-center">
        <div class="spinner"></div>
        <p class="mt-4 text-muted">Loading analytics...</p>
      </div>
    </div>

    <template v-else-if="breakdown && history">
      <AnalyticsHistory
        :filtered-history="filteredHistory"
        :format-currency="formatCurrency"
      />
      <AnalyticsBreakdown
        :breakdown="breakdown"
        :chart-palette="chartPalette"
        :format-currency="formatCurrency"
        :pct="pct"
        :selected="selectedSegment"
        @select-segment="onSelectSegment"
      />
      <AnalyticsDetailPane
        v-if="selectedSegment"
        :item="selectedSegment"
        :color="selectedColor"
        :total="breakdown.total"
        :format-currency="formatCurrency"
        :pct="pct"
        @close="selectedSegment = null"
        @edit-account="openEdit"
      />
    </template>
    <AnalyticsEditModal
      :account="editingAccount"
      :open="editModalOpen"
      :institutions="institutions"
      :account-types="accountTypes"
      :account-statuses="accountStatuses"
      :error="editModalError"
      @close="closeEdit"
      @save="handleEditSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import DataLabelsPlugin from 'chartjs-plugin-datalabels';
import { apiService } from '@/services/ApiService';
import type { PortfolioBreakdown, PortfolioHistory, HistoryPoint, BreakdownItem } from '@/models/WealthTrackDataModels';
import AnalyticsHistory from '@views/AnalyticsHistory.vue';
import AnalyticsBreakdown from '@views/AnalyticsBreakdown.vue';
import AnalyticsDetailPane from '@views/AnalyticsDetailPane.vue';
import AnalyticsEditModal from '@views/AnalyticsEditModal.vue';
import { useAnalyticsEdit } from '@/composables/useAnalyticsEdit';

ChartJS.register(
  CategoryScale, LinearScale, LogarithmicScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler, DataLabelsPlugin,
);

const loading = ref(false);
const error = ref<string | null>(null);
const breakdown = ref<PortfolioBreakdown | null>(null);
const history = ref<PortfolioHistory | null>(null);
const startDate = ref<string>('');
const endDate = ref<string>('');
const today = computed(() => new Date().toISOString().slice(0, 10));

const selectedSegment = ref<BreakdownItem | null>(null);
const selectedColor = ref('');

const {
  editingAccount, editModalOpen, editModalError,
  institutions, accountTypes, accountStatuses,
  openEdit, handleSave: handleEditSave, closeEdit,
} = useAnalyticsEdit(reloadAndReselect);

async function reloadAndReselect(): Promise<void> {
  const prev = selectedSegment.value?.label;
  await loadAll();
  if (prev && breakdown.value)
    selectedSegment.value = [...breakdown.value.byType, ...breakdown.value.byInstitution, ...breakdown.value.byAssetClass].find(i => i.label === prev) ?? selectedSegment.value;
}

function onSelectSegment(item: BreakdownItem | null, color: string): void { selectedSegment.value = item; selectedColor.value = color; }

const chartPalette = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316',
];

async function loadAll(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    const [bd, hist] = await Promise.all([
      apiService.getAnalyticsBreakdown(),
      apiService.getAnalyticsHistory(),
    ]);
    breakdown.value = bd;
    history.value = hist;
    const start = hist.baselineDate || (hist.history.length > 0 ? hist.history[0].date : today.value);
    startDate.value = start;
    endDate.value = today.value;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load analytics';
  } finally {
    loading.value = false;
  }
}

onMounted(() => { void loadAll(); });

const filteredHistory = computed((): HistoryPoint[] => {
  const all = history.value?.history ?? [];
  return all.filter(p => p.date >= startDate.value && p.date <= endDate.value);
});

const totalAccounts = computed((): number => {
  if (!breakdown.value) return 0;
  const accountIds = new Set<number>();
  breakdown.value.byType.forEach(item => {
    item.accounts.forEach(acc => { if (!acc.isClosed) accountIds.add(acc.accountId); });
  });
  return accountIds.size;
});

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
function formatCurrency(v: number): string { return gbp.format(v); }
function pct(v: number, total: number): string {
  if (!total) return '0%';
  return `${((v / total) * 100).toFixed(1)}%`;
}

function downloadCsv(): void {
  if (!breakdown.value) return;
  const rows: string[] = ['Account ID,Account Name,Institution,Account Type,Balance,Closed'];
  for (const typeItem of breakdown.value.byType) {
    for (const acc of typeItem.accounts) {
      const name = `"${acc.accountName.replace(/"/g, '""')}"`;
      const inst = `"${acc.institutionName.replace(/"/g, '""')}"`;
      rows.push(`${acc.accountId},${name},${inst},${typeItem.label},${acc.balance},${acc.isClosed}`);
    }
  }
  rows.push(`,,,,${breakdown.value.total},`);
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-balances-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

</script>

<!-- Uses UnoCSS shortcuts defined in uno.config.ts -->
