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

        <div v-else>
          <!-- Add Win button for Premium Bonds -->
          <div v-if="isPremiumBonds && !showWinForm" class="mb-4">
            <button
              class="btn-primary"
              type="button"
              @click="showWinForm = true"
            >
              Add Win
            </button>
          </div>

          <!-- Win input form -->
          <div v-if="showWinForm" class="mb-4 p-4 border border-border rounded bg-gray-50">
            <div class="flex gap-2">
              <input
                v-model="winAmount"
                type="number"
                placeholder="Enter win amount (£)"
                class="flex-1 px-3 py-2 border border-border rounded"
                step="0.01"
                min="0"
              />
              <button
                class="btn-primary"
                type="button"
                @click="saveWin"
                :disabled="!winAmount || savingWin"
              >
                {{ savingWin ? 'Saving...' : 'Save' }}
              </button>
              <button
                class="btn-modal-secondary"
                type="button"
                @click="cancelWin"
              >
                Cancel
              </button>
            </div>
          </div>

          <div v-if="events.length === 0 && !showWinForm" class="empty-state">
            <p class="empty-icon">📭</p>
            <h3 class="empty-title">No activity yet</h3>
            <p class="empty-text">No events or attributes have been logged for this account.</p>
          </div>

          <div v-else-if="events.length > 0" class="table-wrap">
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
import { ref, computed } from 'vue'
import type { AccountEvent } from '@/models/WealthTrackDataModels';

interface Props {
  open: boolean;
  title: string;
  events: AccountEvent[];
  loading: boolean;
  error?: string;
  accountType?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  addWin: [value: string];
}>();

const showWinForm = ref(false);
const winAmount = ref('');
const savingWin = ref(false);

const isPremiumBonds = computed(() => props.accountType === 'Premium Bonds');

const emitClose = (): void => {
  emit('close');
};

const saveWin = async (): Promise<void> => {
  if (!winAmount.value) return;
  
  savingWin.value = true;
  try {
    emit('addWin', String(winAmount.value));
    winAmount.value = '';
    showWinForm.value = false;
  } finally {
    savingWin.value = false;
  }
};

const cancelWin = (): void => {
  winAmount.value = '';
  showWinForm.value = false;
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
