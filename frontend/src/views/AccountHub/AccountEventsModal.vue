<template>
  <div v-if="open" class="modal-overlay" @mousedown.self="emitClose">
    <div class="modal-content modal-content--large" @click.stop>
      <header class="modal-header">
        <h2 class="modal-title">{{ title }} - Timeline</h2>
        <button class="btn-close" type="button" @click="emitClose">&times;</button>
      </header>

      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p class="mt-4 text-muted">Loading timeline...</p>
        </div>

        <div v-else-if="error" class="error-banner">
          {{ error }}
        </div>

        <div v-else-if="events.length === 0" class="empty-state">
          <p class="empty-icon">📭</p>
          <h3 class="empty-title">No activity yet</h3>
          <p class="empty-text">No events or attributes have been logged for this account.</p>
        </div>

        <div v-else class="table-wrap">
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b border-border bg-gray-50">
                <th class="py-3 px-4 text-left font-semibold text-text-dark">Date</th>
                <th class="py-3 px-4 text-left font-semibold text-text-dark">Type</th>
                <th class="py-3 px-4 text-right font-semibold text-text-dark">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="event in events"
                :key="`${event.source ?? 'event'}-${event.id}`"
                class="event-row border-b border-border hover:bg-gray-50 transition"
              >
                <td class="py-3 px-4 text-gray-600">{{ formatDate(event.createdAt) }}</td>
                <td class="py-3 px-4 text-text-dark">
                  <span
                    class="inline-block px-2 py-0.5 text-xs font-medium rounded mr-2"
                    :class="event.source === 'attribute' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
                  >
                    {{ event.source === 'attribute' ? 'Attr' : 'Event' }}
                  </span>
                  {{ event.eventType }}
                </td>
                <td class="py-3 px-4 text-right font-medium text-text-dark">{{ formatValue(event) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <footer class="modal-footer">
        <button class="btn-modal-secondary" type="button" @click="emitClose">
          Close
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AccountEvent } from '@/models/WealthTrackDataModels';

defineProps<{
  open: boolean;
  title: string;
  events: AccountEvent[];
  loading: boolean;
  error?: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const emitClose = (): void => {
  emit('close');
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatValue = (event: AccountEvent): string => {
  const value = event.value;
  if (!value) return '—';

  // Attributes are displayed as-is (e.g., dates, text)
  if (event.source === 'attribute') {
    return value;
  }

  // Events with numeric values are formatted as currency
  const numeric = parseFloat(value);
  if (Number.isNaN(numeric)) return value;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(numeric);
};
</script>
