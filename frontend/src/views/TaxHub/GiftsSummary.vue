<template>
  <section class="hub-content-card p-6">
    <h3 class="section-title mb-4">Gifts &amp; IHT Exposure</h3>
    <div v-if="loading" class="loading-state py-4">
      <div class="spinner"></div>
    </div>
    <div v-else-if="error" class="error-banner">{{ error }}</div>
    <div v-else-if="gifts.length === 0" class="empty-state py-4">
      <p class="empty-text">No gifts recorded.</p>
    </div>
    <div v-else class="overflow-x-auto">
      <div v-if="pendingDeleteId !== null" class="mb-3 p-3 bg-yellow-50 border border-yellow-300 rounded flex items-center gap-3 text-sm">
        <span>Delete this gift? This will reverse the balance addition.</span>
        <button class="btn-danger" :disabled="deleting" @click="confirmDelete">
          {{ deleting ? 'Deleting…' : 'Yes, delete' }}
        </button>
        <button class="btn-modal-secondary" :disabled="deleting" @click="cancelDelete">Cancel</button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th class="table-cell table-header text-left">Account</th>
            <th class="table-cell table-header text-left">Donor</th>
            <th class="table-cell table-header text-left">Date</th>
            <th class="table-cell table-header text-right">Amount</th>
            <th class="table-cell table-header text-right">Years</th>
            <th class="table-cell table-header text-right">IHT Rate</th>
            <th class="table-cell table-header text-right">IHT Exposure</th>
            <th class="table-cell table-header"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="gift in gifts" :key="gift.groupId" class="border-b border-border hover:bg-gray-50">
            <td class="table-cell">{{ gift.accountName }}</td>
            <td class="table-cell">{{ gift.donor }}</td>
            <td class="table-cell whitespace-nowrap">{{ formatDate(gift.giftDate) }}</td>
            <td class="table-cell text-right">{{ formatGbp(gift.giftValueGbp) }}</td>
            <td class="table-cell text-right">{{ gift.yearsElapsed.toFixed(1) }}</td>
            <td class="table-cell text-right">{{ formatRate(gift.ihtRate) }}</td>
            <td class="table-cell text-right font-medium" :class="exposureClass(gift.ihtExposure)">
              {{ formatGbp(gift.ihtExposure) }}
            </td>
            <td class="table-cell text-right">
              <button
                class="text-gray-400 hover:text-red-600 transition font-bold leading-none"
                title="Delete gift"
                :disabled="deleting"
                @click="pendingDeleteId = gift.groupId"
              >&times;</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { GiftSummary } from '@models/gift';
import { apiService } from '@services/ApiService';

const gifts = ref<GiftSummary[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const pendingDeleteId = ref<number | null>(null);
const deleting = ref(false);

async function loadGifts(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    gifts.value = await apiService.listGifts();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load gifts';
  } finally {
    loading.value = false;
  }
}

onMounted(loadGifts);

async function confirmDelete(): Promise<void> {
  if (pendingDeleteId.value === null) return;
  deleting.value = true;
  try {
    await apiService.deleteGift(pendingDeleteId.value);
    pendingDeleteId.value = null;
    await loadGifts();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to delete gift';
  } finally {
    deleting.value = false;
  }
}

function cancelDelete(): void {
  pendingDeleteId.value = null;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatGbp(value: string): string {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
}

function formatRate(rate: string): string {
  const n = parseFloat(rate);
  if (Number.isNaN(n)) return rate;
  return `${(n * 100).toFixed(0)}%`;
}

function exposureClass(exposure: string): string {
  const n = parseFloat(exposure);
  if (Number.isNaN(n) || n === 0) return 'text-green-600';
  return 'text-red-600';
}
</script>
