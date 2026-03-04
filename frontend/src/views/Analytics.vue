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
      <!-- Portfolio Value Over Time -->
      <div class="hub-content-card p-6">
        <div class="mb-4">
          <h3 class="section-title mb-4">Portfolio Value Over Time</h3>
          <div class="flex flex-col gap-4">
            <!-- Date Range Inputs -->
            <div class="flex items-end gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-slate-700">Start Date (Analysis Baseline)</label>
                <input
                  v-model="startDate"
                  type="date"
                  class="form-input px-3 py-2 border border-gray-300 rounded"
                  :min="minDate"
                  :max="endDate"
                />
                <button
                  v-if="startDate !== history.baselineDate"
                  @click="saveBaselineDate"
                  class="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                >
                  Save Baseline
                </button>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-slate-700">End Date</label>
                <input
                  v-model="endDate"
                  type="date"
                  class="form-input px-3 py-2 border border-gray-300 rounded"
                  :min="startDate"
                  :max="today"
                />
              </div>
            </div>
          </div>
        </div>
        <div v-if="historyChartData" class="chart-container chart-tall">
          <Bar :data="historyChartData" :options="barChartOptions" />
        </div>
        <div v-else class="text-center text-muted py-8">
          No balance history recorded yet.
        </div>
      </div>

      <!-- Breakdown charts -->
      <div class="analytics-grid">
        <div class="analytics-card">
          <h3 class="section-title mb-4">By Account Type</h3>
          <div v-if="breakdown.byType.length" class="chart-container">
            <Doughnut :data="typeChartData" :options="doughnutOptions" />
          </div>
          <div v-else class="text-center text-muted py-8">No data.</div>
          <div class="legend-list mt-4">
            <div
              v-for="(item, i) in breakdown.byType"
              :key="item.label"
              class="legend-row"
            >
              <span class="legend-dot" :style="{ background: chartPalette[i % chartPalette.length] }"></span>
              <span class="legend-label">{{ item.label }}</span>
              <span class="legend-value">{{ formatCurrency(item.value) }}</span>
              <span class="legend-pct">{{ pct(item.value, breakdown.total) }}</span>
            </div>
          </div>
        </div>

        <div class="analytics-card">
          <h3 class="section-title mb-4">By Asset Class</h3>
          <div v-if="breakdown.byAssetClass.length" class="chart-container">
            <Doughnut :data="assetClassChartData" :options="doughnutOptions" />
          </div>
          <div v-else class="text-center text-muted py-8">No data.</div>
          <div class="legend-list mt-4">
            <div
              v-for="(item, i) in breakdown.byAssetClass"
              :key="item.label"
              class="legend-row"
            >
              <span class="legend-dot" :style="{ background: chartPalette[i % chartPalette.length] }"></span>
              <span class="legend-label">{{ item.label }}</span>
              <span class="legend-value">{{ formatCurrency(item.value) }}</span>
              <span class="legend-pct">{{ pct(item.value, breakdown.total) }}</span>
            </div>
          </div>
        </div>

        <div class="analytics-card">
          <h3 class="section-title mb-4">By Institution</h3>
          <div v-if="breakdown.byInstitution.length" class="chart-institution">
            <Bar :data="institutionChartData" :options="barOptions" />
          </div>
          <div v-else class="text-center text-muted py-8">No data.</div>
          <div class="legend-list mt-4">
            <div
              v-for="(item, i) in breakdown.byInstitution"
              :key="item.label"
              class="legend-row"
            >
              <span class="legend-dot" :style="{ background: chartPalette[i % chartPalette.length] }"></span>
              <span class="legend-label">{{ item.label }}</span>
              <span class="legend-value">{{ formatCurrency(item.value) }}</span>
              <span class="legend-pct">{{ pct(item.value, breakdown.total) }}</span>
            </div>
          </div>
        </div>
      </div>
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
import { Bar, Doughnut } from 'vue-chartjs';
import { apiService } from '@/services/ApiService';
import { referenceDataService } from '@/services/ReferenceDataService';
import type { PortfolioBreakdown, PortfolioHistory, HistoryPoint } from '@/models/WealthTrackDataModels';

ChartJS.register(
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
);

// ─── State ────────────────────────────────────────────────────────────────────

const loading = ref(false);
const error = ref<string | null>(null);
const breakdown = ref<PortfolioBreakdown | null>(null);
const history = ref<PortfolioHistory | null>(null);
const startDate = ref<string>('');
const endDate = ref<string>('');
const today = computed(() => new Date().toISOString().slice(0, 10));
const minDate = computed(() => history.value?.baselineDate ?? '2026-01-01');

const rangeOptions = [
  { key: '3M',  days: 91  },
  { key: '6M',  days: 182 },
  { key: '1Y',  days: 365 },
  { key: '2Y',  days: 730 },
  { key: 'All', days: 0   },  // 0 = no filter
].map(o => ({ ...o, label: o.key }));

// ─── Colour palette ────────────────────────────────────────────────────────────

const chartPalette = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316',
];

// ─── Load data ─────────────────────────────────────────────────────────────────

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
    
    // Set date range: start from baseline or earliest history date, end at today
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

// ─── Range filtering (client-side) ─────────────────────────────────

const filteredHistory = computed((): HistoryPoint[] => {
  const all = history.value?.history ?? [];
  return all.filter(p => p.date >= startDate.value && p.date <= endDate.value);
});

// ─── Formatting helpers ───────────────────────────────────────────────────────

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
function formatCurrency(v: number): string { return gbp.format(v); }
function pct(v: number, total: number): string {
  if (!total) return '0%';
  return `${((v / total) * 100).toFixed(1)}%`;
}

function formatDateLabel(dateStr: string, totalPoints: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (totalPoints <= 90) {
    // Daily range — show "15 Jan"
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  // Longer ranges — show "Jan '24"
  return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

// ─── Chart data ───────────────────────────────────────────────────────────────

const historyChartData = computed(() => {
  const pts = filteredHistory.value.filter(p => p.totalValue > 0);
  if (!pts.length) return null;
  const n = pts.length;
  return {
    labels: pts.map(p => formatDateLabel(p.date, n)),
    datasets: [{
      label: 'Portfolio Value',
      data: pts.map(p => p.totalValue),
      backgroundColor: 'rgba(59,130,246,0.8)',
      borderColor: '#3b82f6',
      borderWidth: 1,
      borderRadius: 2,
    }],
  };
});

const typeChartData = computed(() => {
  const items = breakdown.value?.byType ?? [];
  return {
    labels: items.map(i => i.label),
    datasets: [{
      data: items.map(i => i.value),
      backgroundColor: chartPalette,
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };
});

const institutionChartData = computed(() => {
  const items = breakdown.value?.byInstitution ?? [];
  return {
    labels: items.map(i => i.label),
    datasets: [{
      label: 'Value',
      data: items.map(i => i.value),
      backgroundColor: items.map((_, idx) => chartPalette[idx % chartPalette.length]),
      borderRadius: 4,
    }],
  };
});

const assetClassChartData = computed(() => {
  const items = breakdown.value?.byAssetClass ?? [];
  return {
    labels: items.map(i => i.label),
    datasets: [{
      data: items.map(i => i.value),
      backgroundColor: chartPalette,
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };
});

async function saveBaselineDate(): Promise<void> {
  try {
    // Fetch the analytics_baseline_date reference data item by class key
    const items = await referenceDataService.listByClass('analytics_baseline_date');
    if (items.length === 0) {
      error.value = 'Baseline date configuration not found';
      return;
    }

    const item = items[0];
    // Update the reference data with the new date
    await referenceDataService.update(item.id, {
      classKey: 'analytics_baseline_date',
      referenceValue: startDate.value,
      sortIndex: item.sortIndex || 0,
    });

    // Update the stored baseline date in history
    if (history.value) {
      history.value.baselineDate = startDate.value;
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to save baseline date';
  }
}

// ─── Chart options ────────────────────────────────────────────────────────────

const barChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  animation: { duration: 300 },
  layout: {
    padding: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        label: (ctx: any) => ` ${formatCurrency(ctx.parsed.y as number)}`,
        // Show the actual date (not the potentially-thinned axis label) in tooltip
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        title: (items: any[]) => {
          const idx = items[0]?.dataIndex as number;
          const pt = filteredHistory.value[idx];
          if (!pt) return '';
          const d = new Date(pt.date + 'T00:00:00');
          return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        },
      },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: {
        color: '#64748b',
        font: { size: 11 },
        maxTicksLimit: 12,
        maxRotation: 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: function(this: any, _val: any, index: number, ticks: any[]) {
          const label = this.getLabelForValue(index);
          const prev = index > 0 ? this.getLabelForValue(ticks[index - 1].value) : null;
          return label !== prev ? label : null;
        },
      },
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: {
        color: '#64748b',
        font: { size: 11 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: (v: any) => formatCurrency(Number(v)),
      },
      // Use linear for better label spacing
      type: 'linear' as const,
    },
  },
}));

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        label: (ctx: any) => ` ${formatCurrency(ctx.parsed as number)} (${pct(ctx.parsed as number, breakdown.value?.total ?? 0)})`,
      },
    },
  },
};

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  layout: {
    padding: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        label: (ctx: any) => ` ${formatCurrency(ctx.parsed.x as number)}`,
      },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: {
        color: '#64748b',
        font: { size: 11 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: (v: any) => formatCurrency(Number(v)),
      },
    },
    y: {
      grid: { display: false },
      ticks: {
        color: '#64748b',
        font: { size: 11 },
        padding: 12,
      },
      offset: true,
    },
  },
};
</script>

<!-- Uses UnoCSS shortcuts defined in uno.config.ts -->
