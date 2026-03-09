<template>
  <div class="hub-content-card p-6">
    <div class="mb-4">
      <h3 class="section-title mb-4">Portfolio Value Over Time</h3>
      <div class="flex flex-col gap-4">
        <div class="flex items-end gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Start Date (Analysis Baseline)</label>
            <input
              :value="startDate"
              @input="(e) => $emit('update:startDate', (e.target as HTMLInputElement).value)"
              type="date"
              class="form-input px-3 py-2 border border-gray-300 rounded"
              :min="minDate"
              :max="endDate"
            />
            <button
              v-if="startDate !== baselineDate"
              @click="$emit('saveBaseline')"
              class="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
            >
              Save Baseline
            </button>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">End Date</label>
            <input
              :value="endDate"
              @input="(e) => $emit('update:endDate', (e.target as HTMLInputElement).value)"
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
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import type { HistoryPoint } from '@/models/WealthTrackDataModels';

const props = defineProps<{
  startDate: string;
  endDate: string;
  today: string;
  minDate: string;
  baselineDate: string;
  filteredHistory: HistoryPoint[];
  formatCurrency: (v: number) => string;
}>();

defineEmits<{
  'update:startDate': [value: string];
  'update:endDate': [value: string];
  saveBaseline: [];
}>();

function formatDateLabel(dateStr: string, totalPoints: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (totalPoints <= 90) return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

const historyChartData = computed(() => {
  const pts = props.filteredHistory.filter(p => p.totalValue > 0);
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

const barChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  animation: { duration: 300 },
  layout: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        label: (ctx: any) => ` ${props.formatCurrency(ctx.parsed.y as number)}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        title: (items: any[]) => {
          const idx = items[0]?.dataIndex as number;
          const pt = props.filteredHistory[idx];
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
        color: '#64748b', font: { size: 11 }, maxTicksLimit: 12, maxRotation: 0,
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
      ticks: { color: '#64748b', font: { size: 11 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: (v: any) => props.formatCurrency(Number(v)) },
      type: 'linear' as const,
    },
  },
}));
</script>
