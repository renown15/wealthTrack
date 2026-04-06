<template>
  <header class="header-panel">
    <div class="header-top">
      <div>
        <h2 class="header-title">Tax Hub</h2>
        <p class="header-subtitle">Manage tax returns and certificates for eligible accounts.</p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="emit('addPeriod')">+ Add Tax Period</button>
      </div>
    </div>

    <div v-if="periods.length > 0" class="stats-grid">
      <article
        v-for="period in periods"
        :key="period.id"
        class="stat-card cursor-pointer"
        :class="{ 'ring-2 ring-blue-500': period.id === selectedPeriodId }"
        @click="emit('selectPeriod', period.id)"
        :title="`${formatDate(period.startDate)} – ${formatDate(period.endDate)}`"
      >
        <p class="stat-label flex items-center justify-between">
          <span>
            {{ period.name }}
            <span class="info-icon" style="cursor: pointer;">{{ Icons.info }}</span>
          </span>
          <button
            class="btn-secondary text-xs ml-2"
            @click.stop="emit('deletePeriod', period.id, period.name)"
          >REMOVE</button>
        </p>
        <p class="stat-value text-base">
          {{ formatDate(period.startDate) }} – {{ formatDate(period.endDate) }}
        </p>
      </article>
    </div>

    <div v-else class="mt-4 text-white/80 text-sm">
      No tax periods yet. Click <strong>+ Add Tax Period</strong> to get started.
    </div>
  </header>
</template>

<script setup lang="ts">
import type { TaxPeriod } from '@models/TaxModels';
import { Icons } from '@/constants/icons';

defineProps<{
  periods: TaxPeriod[];
  selectedPeriodId: number | null;
}>();

const emit = defineEmits<{
  addPeriod: [];
  selectPeriod: [periodId: number];
  deletePeriod: [periodId: number, periodName: string];
}>();

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
</script>
