<template>
  <div v-if="open" class="modal-overlay" @click.self="emitClose">
    <div class="modal-content events-modal" @click.stop>
      <header class="modal-header">
        <div>
          <p class="eyebrow">Event timeline</p>
          <h2>{{ title }}</h2>
        </div>
        <button class="btn-close" type="button" @click="emitClose">×</button>
      </header>

      <div class="modal-body">
        <div v-if="loading" class="events-loading">Loading events...</div>
        <div v-else-if="error" class="events-error">{{ error }}</div>
        <div v-else-if="events.length === 0" class="events-empty">
          <p>No events logged for this account yet.</p>
        </div>
        <ul v-else class="events-list">
          <li v-for="event in events" :key="event.id" class="event-row">
            <div class="event-main">
              <span class="event-date">{{ formatDate(event.createdAt) }}</span>
              <span class="event-type">{{ event.eventType }}</span>
              <span class="event-value">{{ formatCurrency(event.value) }}</span>
            </div>
            <p v-if="event.value" class="event-note">{{ event.value }}</p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AccountEvent } from '@/models/Portfolio';

const props = defineProps<{
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
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const formatCurrency = (value?: string | number | null): string => {
  if (!value) return '—';
  const numeric = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(numeric)) return value?.toString() ?? '—';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(numeric);
};
</script>