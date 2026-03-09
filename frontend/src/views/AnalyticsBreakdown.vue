<template>
  <div class="analytics-grid">
    <div class="analytics-card">
      <h3 class="section-title mb-4">By Account Type</h3>
      <div v-if="breakdown.byType.length" class="chart-container">
        <Doughnut :data="typeChartData" :options="doughnutOptions" />
      </div>
      <div v-else class="text-center text-muted py-8">No data.</div>
      <div class="legend-list mt-4">
        <div v-for="(item, i) in breakdown.byType" :key="item.label" class="legend-row">
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
        <div v-for="(item, i) in breakdown.byAssetClass" :key="item.label" class="legend-row">
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
        <div v-for="(item, i) in breakdown.byInstitution" :key="item.label" class="legend-row">
          <span class="legend-dot" :style="{ background: chartPalette[i % chartPalette.length] }"></span>
          <span class="legend-label">{{ item.label }}</span>
          <span class="legend-value">{{ formatCurrency(item.value) }}</span>
          <span class="legend-pct">{{ pct(item.value, breakdown.total) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Bar, Doughnut } from 'vue-chartjs';
import type { PortfolioBreakdown } from '@/models/WealthTrackDataModels';

const props = defineProps<{
  breakdown: PortfolioBreakdown;
  chartPalette: string[];
  formatCurrency: (v: number) => string;
  pct: (v: number, total: number) => string;
}>();

const typeChartData = computed(() => ({
  labels: props.breakdown.byType.map(i => i.label),
  datasets: [{ data: props.breakdown.byType.map(i => i.value), backgroundColor: props.chartPalette, borderWidth: 2, borderColor: '#fff' }],
}));

const assetClassChartData = computed(() => ({
  labels: props.breakdown.byAssetClass.map(i => i.label),
  datasets: [{ data: props.breakdown.byAssetClass.map(i => i.value), backgroundColor: props.chartPalette, borderWidth: 2, borderColor: '#fff' }],
}));

const institutionChartData = computed(() => ({
  labels: props.breakdown.byInstitution.map(i => i.label),
  datasets: [{
    label: 'Value',
    data: props.breakdown.byInstitution.map(i => i.value),
    backgroundColor: props.breakdown.byInstitution.map((_, idx) => props.chartPalette[idx % props.chartPalette.length]),
    borderRadius: 4,
  }],
}));

const doughnutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        label: (ctx: any) => ` ${props.formatCurrency(ctx.parsed as number)} (${props.pct(ctx.parsed as number, props.breakdown.total)})`,
      },
    },
  },
}));

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  layout: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        label: (ctx: any) => ` ${props.formatCurrency(ctx.parsed.x as number)}`,
      },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: { color: '#64748b', font: { size: 11 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: (v: any) => props.formatCurrency(Number(v)) },
    },
    y: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 }, padding: 12 }, offset: true },
  },
};
</script>
