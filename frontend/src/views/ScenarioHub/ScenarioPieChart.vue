<template>
  <div>
    <p class="section-title mb-3">{{ title }}</p>
    <div class="chart-container" style="height:200px;">
      <Doughnut :data="chartData" :options="chartOptions" />
    </div>
    <ul class="legend-list mt-3">
      <li v-for="(entry, i) in entries" :key="entry.label" class="legend-row">
        <span class="legend-dot" :style="{ background: palette[i % palette.length] }"></span>
        <span class="legend-label">{{ entry.label }}</span>
      </li>
    </ul>
    <table v-if="tableData.length" class="w-full mt-4 text-xs">
      <tbody>
        <template v-for="member in tableData" :key="member.label">
          <tr>
            <td colspan="3" class="pt-3 pb-1 font-semibold text-text-dark border-t border-border">{{ member.label }}</td>
          </tr>
          <tr v-for="row in member.rows" :key="row.label">
            <td class="py-0.5 text-muted pl-2">{{ row.label }}</td>
            <td class="py-0.5 font-mono text-right whitespace-nowrap">{{ row.formatted }}</td>
            <td class="py-0.5 text-right pl-2 text-muted">{{ row.pct }}%</td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(ArcElement, Tooltip, ChartDataLabels);

const props = defineProps<{
  title: string;
  entries: { label: string; value: number }[];
  breakdown?: Record<string, { label: string; value: number }[]>;
  showTable?: boolean;
}>();

const palette = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];

const fmt = (val: number): string =>
  val >= 1_000_000 ? `£${(val / 1_000_000).toFixed(1)}m`
  : val >= 1_000 ? `£${Math.round(val / 1_000)}k`
  : `£${Math.round(val)}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chartOptions: any = {
  responsive: true, maintainAspectRatio: false, cutout: '60%',
  plugins: {
    legend: { display: false },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tooltip: { callbacks: {
      label: (ctx: any) => ` ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(ctx.parsed as number)}`,
      afterBody: (items: any[]) => {
        if (props.showTable || !props.breakdown || !items.length) return [];
        const bd = props.breakdown[items[0].label as string] ?? [];
        const total = bd.reduce((s, e) => s + e.value, 0);
        return bd.filter(e => e.value > 0).map(e =>
          `  ${e.label}: ${fmt(e.value)} (${total > 0 ? Math.round(e.value / total * 100) : 0}%)`,
        );
      },
    } },
    datalabels: {
      color: '#fff', font: { weight: 'bold' as const, size: 11 }, display: 'auto',
      formatter: (val: number) => (val > 0 ? fmt(val) : ''),
    },
  },
};

const chartData = computed(() => ({
  labels: props.entries.map(e => e.label),
  datasets: [{ data: props.entries.map(e => e.value), backgroundColor: palette, borderWidth: 2, borderColor: '#fff' }],
}));

const tableData = computed(() => {
  if (!props.showTable || !props.breakdown) return [];
  return props.entries
    .map(e => {
      const rows = (props.breakdown![e.label] ?? []).filter(r => r.value > 0);
      const total = rows.reduce((s, r) => s + r.value, 0);
      return {
        label: e.label,
        rows: rows.map(r => ({ label: r.label, formatted: fmt(r.value), pct: total > 0 ? Math.round(r.value / total * 100) : 0 })),
      };
    })
    .filter(e => e.rows.length > 0);
});
</script>
