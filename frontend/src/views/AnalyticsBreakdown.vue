<template>
  <div class="analytics-grid">
    <div class="analytics-card">
      <h3 class="section-title mb-4">By Account Type</h3>
      <div v-if="breakdown.byType.length" class="chart-container">
        <Doughnut :data="typeChartData" :options="typeOptions" />
      </div>
      <div v-else class="text-center text-muted py-8">No data.</div>
      <div class="legend-list mt-4">
        <div
          v-for="(item, i) in breakdown.byType" :key="item.label"
          class="legend-row cursor-pointer hover:bg-blue-50 rounded-md px-1 -mx-1 transition-colors"
          :class="{ 'bg-blue-50': selected?.label === item.label }"
          @click="selectItem(item, i)"
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
      <p class="text-[0.7rem] uppercase tracking-widest text-slate-400 mb-2">All assets</p>
      <div v-if="breakdown.byAssetClass.length" class="chart-container">
        <Doughnut :data="assetClassChartData" :options="assetClassOptions" />
      </div>
      <div v-else class="text-center text-muted py-8">No data.</div>
      <div class="legend-list mt-4 mb-8">
        <div
          v-for="(item, i) in breakdown.byAssetClass" :key="item.label"
          class="legend-row cursor-pointer hover:bg-blue-50 rounded-md px-1 -mx-1 transition-colors"
          :class="{ 'bg-blue-50': selected?.label === item.label }"
          @click="selectItem(item, i)"
        >
          <span class="legend-dot" :style="{ background: chartPalette[i % chartPalette.length] }"></span>
          <span class="legend-label">{{ item.label }}</span>
          <span class="legend-value">{{ formatCurrency(item.value) }}</span>
          <span class="legend-pct">{{ pct(item.value, breakdown.total) }}</span>
        </div>
      </div>
      <p class="text-[0.7rem] uppercase tracking-widest text-slate-400 mb-2">Excl. pension</p>
      <div v-if="breakdown.byAssetClassNoPension.length" class="chart-container">
        <Doughnut :data="noPensionChartData" :options="noPensionOptions" />
      </div>
      <div v-else class="text-center text-muted py-8">No data.</div>
      <div class="legend-list mt-4">
        <div
          v-for="(item, i) in breakdown.byAssetClassNoPension" :key="item.label"
          class="legend-row cursor-pointer hover:bg-blue-50 rounded-md px-1 -mx-1 transition-colors"
          :class="{ 'bg-blue-50': selected?.label === item.label }"
          @click="selectItem(item, i)"
        >
          <span class="legend-dot" :style="{ background: chartPalette[i % chartPalette.length] }"></span>
          <span class="legend-label">{{ item.label }}</span>
          <span class="legend-value">{{ formatCurrency(item.value) }}</span>
          <span class="legend-pct">{{ pct(item.value, noPensionTotal) }}</span>
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
          v-for="(item, i) in breakdown.byInstitution" :key="item.label"
          class="legend-row cursor-pointer hover:bg-blue-50 rounded-md px-1 -mx-1 transition-colors"
          :class="{ 'bg-blue-50': selected?.label === item.label }"
          @click="selectItem(item, i)"
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

<script setup lang="ts">
import { computed } from 'vue';
import { Bar, Doughnut } from 'vue-chartjs';
import type { PortfolioBreakdown, BreakdownItem } from '@/models/WealthTrackDataModels';

const props = defineProps<{
  breakdown: PortfolioBreakdown;
  chartPalette: string[];
  formatCurrency: (v: number) => string;
  pct: (v: number, total: number) => string;
  selected: BreakdownItem | null;
}>();

const emit = defineEmits<{ selectSegment: [item: BreakdownItem | null, color: string] }>();

function selectItem(item: BreakdownItem, idx: number): void {
  const color = props.chartPalette[idx % props.chartPalette.length];
  emit('selectSegment', props.selected?.label === item.label ? null : item, color);
}

const typeChartData = computed(() => ({
  labels: props.breakdown.byType.map(i => i.label),
  datasets: [{ data: props.breakdown.byType.map(i => i.value), backgroundColor: props.chartPalette, borderWidth: 2, borderColor: '#fff' }],
}));

const assetClassChartData = computed(() => ({
  labels: props.breakdown.byAssetClass.map(i => i.label),
  datasets: [{ data: props.breakdown.byAssetClass.map(i => i.value), backgroundColor: props.chartPalette, borderWidth: 2, borderColor: '#fff' }],
}));

const noPensionTotal = computed(() => props.breakdown.byAssetClassNoPension.reduce((s, i) => s + i.value, 0));
const noPensionChartData = computed(() => ({
  labels: props.breakdown.byAssetClassNoPension.map(i => i.label),
  datasets: [{ data: props.breakdown.byAssetClassNoPension.map(i => i.value), backgroundColor: props.chartPalette, borderWidth: 2, borderColor: '#fff' }],
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeDoughnutOptions(items: BreakdownItem[], showLabels = false, total?: number): any {
  const activeTotal = total ?? props.breakdown.total;
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => ` ${props.formatCurrency(ctx.parsed as number)} (${props.pct(ctx.parsed as number, activeTotal)})`,
        },
      },
      datalabels: !showLabels ? { display: false } : {
        color: '#fff', font: { weight: 'bold' as const, size: 16 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        display: (ctx: any) => { const d = ctx.dataset.data as number[]; return d[ctx.dataIndex] / d.reduce((a: number, b: number) => a + b, 0) > 0.04; },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (v: number, ctx: any) => { const d = ctx.dataset.data as number[]; return `${((v / d.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1)}`; },
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onClick: (_e: unknown, elements: any[]) => {
      if (!elements.length) { emit('selectSegment', null, ''); return; }
      const idx: number = elements[0].index;
      selectItem(items[idx], idx);
    },
  };
}

const typeOptions = computed(() => makeDoughnutOptions(props.breakdown.byType));
const assetClassOptions = computed(() => makeDoughnutOptions(props.breakdown.byAssetClass, true));
const noPensionOptions = computed(() => makeDoughnutOptions(props.breakdown.byAssetClassNoPension, true, noPensionTotal.value));

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  layout: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
  plugins: {
    legend: { display: false },
    datalabels: { display: false },
    tooltip: {
      callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        label: (ctx: any) => ` ${props.formatCurrency(ctx.parsed.x as number)}`,
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick: (_e: unknown, elements: any[]) => {
    if (!elements.length) { emit('selectSegment', null, ''); return; }
    const idx: number = elements[0].index;
    selectItem(props.breakdown.byInstitution[idx], idx);
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
