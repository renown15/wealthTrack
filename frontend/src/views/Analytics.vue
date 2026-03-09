<template>
  <div class="page-view">
    <div class="hub-header-card">
      <div class="analytics-header">
        <div>
          <h2 class="analytics-title">Analytics</h2>
          <p class="analytics-subtitle">Portfolio performance and composition</p>
        </div>
        <div v-if="!loading && breakdown" class="analytics-summary">
          <div class="summary-stat">
            <span class="summary-label">Total Value</span>
            <span class="summary-value">{{ formatCurrency(breakdown.total) }}</span>
          </div>
          <div class="summary-stat">
            <span class="summary-label">Account Types</span>
            <span class="summary-value">{{ breakdown.byType.length }}</span>
          </div>
          <div class="summary-stat">
            <span class="summary-label">Institutions</span>
            <span class="summary-value">{{ breakdown.byInstitution.length }}</span>
          </div>
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
        :start-date="startDate"
        :end-date="endDate"
        :today="today"
        :min-date="minDate"
        :baseline-date="history.baselineDate ?? ''"
        :filtered-history="filteredHistory"
        :format-currency="formatCurrency"
        @update:start-date="startDate = $event"
        @update:end-date="endDate = $event"
        @save-baseline="saveBaselineDate"
      />
      <AnalyticsBreakdown
        :breakdown="breakdown"
        :chart-palette="chartPalette"
        :format-currency="formatCurrency"
        :pct="pct"
      />
    </template>
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
import { apiService } from '@/services/ApiService';
import { referenceDataService } from '@/services/ReferenceDataService';
import type { PortfolioBreakdown, PortfolioHistory, HistoryPoint } from '@/models/WealthTrackDataModels';
import AnalyticsHistory from '@views/AnalyticsHistory.vue';
import AnalyticsBreakdown from '@views/AnalyticsBreakdown.vue';

ChartJS.register(
  CategoryScale, LinearScale, LogarithmicScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler,
);

const loading = ref(false);
const error = ref<string | null>(null);
const breakdown = ref<PortfolioBreakdown | null>(null);
const history = ref<PortfolioHistory | null>(null);
const startDate = ref<string>('');
const endDate = ref<string>('');
const today = computed(() => new Date().toISOString().slice(0, 10));
const minDate = computed(() => history.value?.baselineDate ?? '2026-01-01');

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

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
function formatCurrency(v: number): string { return gbp.format(v); }
function pct(v: number, total: number): string {
  if (!total) return '0%';
  return `${((v / total) * 100).toFixed(1)}%`;
}

async function saveBaselineDate(): Promise<void> {
  try {
    const items = await referenceDataService.listByClass('analytics_baseline_date');
    if (items.length === 0) { error.value = 'Baseline date configuration not found'; return; }
    const item = items[0];
    await referenceDataService.update(item.id, {
      classKey: 'analytics_baseline_date',
      referenceValue: startDate.value,
      sortIndex: item.sortIndex || 0,
    });
    if (history.value) { history.value.baselineDate = startDate.value; }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to save baseline date';
  }
}
</script>

<!-- Uses UnoCSS shortcuts defined in uno.config.ts -->
