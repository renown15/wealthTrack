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
        <div class="flex items-center justify-between mb-4">
          <h3 class="section-title">Portfolio Value Over Time</h3>
          <div class="range-buttons">
            <button
              v-for="opt in rangeOptions"
              :key="opt.key"
              class="range-btn"
              :class="{ 'range-btn-active': selectedRange === opt.key }"
              @click="selectedRange = opt.key"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <div v-if="historyChartData" class="chart-container chart-tall">
          <Line :data="historyChartData" :options="lineOptions" />
        </div>
        <div v-else class="text-center text-muted py-8">
          No balance history recorded yet.
        </div>
      </div>

      <!-- Breakdown charts -->
      <div class="analytics-grid">
        <div class="hub-content-card p-6">
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

        <div class="hub-content-card p-6">
          <h3 class="section-title mb-4">By Institution</h3>
          <div v-if="breakdown.byInstitution.length" class="chart-container">
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
import { Line, Doughnut, Bar } from 'vue-chartjs';
import { apiService } from '@/services/ApiService';
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
const selectedRange = ref<string>('All');

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
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load analytics';
  } finally {
    loading.value = false;
  }
}

onMounted(() => { void loadAll(); });

// ─── Range filtering (client-side, no extra API call) ─────────────────────────

const filteredHistory = computed((): HistoryPoint[] => {
  const all = history.value?.history ?? [];
  const opt = rangeOptions.find(o => o.key === selectedRange.value);
  if (!opt || opt.days === 0) return all;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - opt.days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return all.filter(p => p.date >= cutoffStr);
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
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.08)',
      fill: true,
      tension: 0.2,
      pointRadius: 0,
      pointHoverRadius: 5,
      borderWidth: 2,
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

// ─── Chart options ────────────────────────────────────────────────────────────

const lineOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  animation: { duration: 300 },
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
        // Only show a tick when the label changes (avoids duplicate "Jan '24" labels
        // when Chart.js picks adjacent days in the same month)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: function(this: any, _val: any, index: number, ticks: any[]) {
          const label = this.getLabelForValue(index);
          const prev = index > 0 ? this.getLabelForValue(ticks[index - 1].value) : null;
          return label !== prev ? label : null;
        },
      },
    },
    y: {
      type: 'logarithmic' as const,
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: {
        color: '#64748b',
        font: { size: 11 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: (v: any) => formatCurrency(Number(v)),
      },
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
      ticks: { color: '#64748b', font: { size: 11 } },
    },
  },
};
</script>

<!-- Uses UnoCSS shortcuts defined in uno.config.ts -->
