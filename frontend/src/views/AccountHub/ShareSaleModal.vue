<template>
  <div v-if="open" class="modal-overlay" @mousedown.self="emitClose">
    <div class="modal-content modal-lg" @click.stop>
      <header class="modal-header">
        <h2 class="modal-title">Share Sale — {{ sharesAccount?.account.name }}</h2>
        <button class="btn-close" type="button" @click="emitClose">&times;</button>
      </header>

      <!-- Tab bar -->
      <div class="flex border-b border-gray-200 px-6 pt-2 gap-6">
        <button
          class="pb-2 text-sm font-medium border-b-2 transition-colors"
          :class="tab === 'record' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'"
          type="button"
          @click="tab = 'record'"
        >Record Sale</button>
        <button
          class="pb-2 text-sm font-medium border-b-2 transition-colors"
          :class="tab === 'history' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'"
          type="button"
          @click="switchToHistory"
        >Sale History</button>
      </div>

      <!-- Record tab -->
      <div v-if="tab === 'record'" class="modal-body">
        <div v-if="result">
          <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
            <p class="font-semibold text-green-800">Sale recorded successfully</p>
          </div>
          <SaleSummaryCard :sale="resultAsSummary" :all-items="allItems" />
        </div>

        <div v-else>
          <div v-if="error" class="error-banner mb-4">{{ error }}</div>

          <div class="form-group">
            <label class="form-label">Shares sold</label>
            <input v-model="sharesSold" type="number" class="form-input" placeholder="e.g. 100" min="0" step="1" />
          </div>

          <div class="form-group">
            <label class="form-label">Sale price per share (pence)</label>
            <input v-model="salePricePerShare" type="number" class="form-input" placeholder="e.g. 15432" min="0" step="1" />
          </div>

          <div class="form-group">
            <label class="form-label">Cash / Savings account (receives proceeds)</label>
            <select v-model="cashAccountId" class="form-select">
              <option value="">— select account —</option>
              <option v-for="item in cashAccounts" :key="item.account.id" :value="item.account.id">
                {{ item.institution?.name || '?' }} | {{ item.account.name }} {{ formatAccountDetails(item) }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Tax Liability account (CGT)</label>
            <select v-model="taxAccountId" class="form-select">
              <option value="">— select account —</option>
              <option v-for="item in taxAccounts" :key="item.account.id" :value="item.account.id">
                {{ item.account.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- History tab -->
      <div v-else class="modal-body">
        <div v-if="historyLoading" class="text-sm text-gray-500 py-4 text-center">Loading sales history…</div>
        <div v-else-if="history.length === 0" class="text-sm text-gray-500 py-4 text-center">No sales recorded yet.</div>
        <div v-else class="space-y-4">
          <SaleSummaryCard
            v-for="sale in history"
            :key="sale.groupId"
            :sale="sale"
            :all-items="allItems"
          />
        </div>
      </div>

      <footer class="modal-footer">
        <button class="btn-modal-secondary" type="button" @click="emitClose">
          {{ result ? 'Close' : 'Cancel' }}
        </button>
        <button
          v-if="tab === 'record' && !result"
          class="btn-primary"
          type="button"
          :disabled="!canSubmit || submitting"
          @click="submit"
        >
          {{ submitting ? 'Recording…' : 'Record Sale' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { PortfolioItem } from '@/models/WealthTrackDataModels';
import type { ShareSaleSummary } from '@/models/ShareSaleModels';
import { useShareSale } from '@/composables/useShareSale';
import SaleSummaryCard from '@views/AccountHub/SaleSummaryCard.vue';

const props = defineProps<{
  open: boolean;
  sharesAccountId: number;
  allItems: PortfolioItem[];
  startTab?: 'record' | 'history';
}>();

const emit = defineEmits<{
  close: [];
  sold: [];
}>();

const { submitting, error, result, history, historyLoading, getCashAccounts, getTaxAccounts, loadHistory, submitSale, reset } = useShareSale();

const tab = ref<'record' | 'history'>('record');
const sharesSold = ref('');
const salePricePerShare = ref('');
const cashAccountId = ref<number | ''>('');
const taxAccountId = ref<number | ''>('');

const cashAccounts = computed(() => getCashAccounts(props.allItems));
const taxAccounts = computed(() => getTaxAccounts(props.allItems));

const sharesAccount = computed(() =>
  props.allItems.find((item) => item.account.id === props.sharesAccountId)
);

const canSubmit = computed(() =>
  !!sharesSold.value && !!salePricePerShare.value &&
  cashAccountId.value !== '' && taxAccountId.value !== ''
);

// Adapt the POST response into ShareSaleSummary shape for SaleSummaryCard
const resultAsSummary = computed((): ShareSaleSummary => {
  const r = result.value!;
  const now = new Date().toISOString();
  const cashId = cashAccountId.value as number;
  const taxId = taxAccountId.value as number;
  return {
    groupId: 0,
    soldAt: now,
    events: [
      { id: 0, accountId: props.sharesAccountId, eventType: 'Share Sale', value: r.sharesSold, createdAt: now },
      { id: 0, accountId: cashId, eventType: 'Deposit', value: r.proceeds, createdAt: now },
      { id: 0, accountId: taxId, eventType: 'Capital Gains Tax', value: r.cgt, createdAt: now },
    ],
    attributes: [],
    sharesSold: r.sharesSold,
    proceeds: r.proceeds,
    cgt: r.cgt,
    cashNewBalance: r.cashNewBalance,
    taxNewBalance: r.taxLiabilityNewBalance,
    remainingShares: r.remainingShares ?? '0',
    salePricePence: r.salePricePerShare,
    purchasePricePence: r.purchasePricePerShare,
    capitalGain: r.capitalGain,
    cgtRate: r.cgtRate,
  };
});

async function switchToHistory(): Promise<void> {
  tab.value = 'history';
  await loadHistory(props.sharesAccountId);
}

watch(
  () => props.open,
  async (newOpen) => {
    if (newOpen) {
      tab.value = props.startTab ?? 'record';
      if (tab.value === 'history') {
        await loadHistory(props.sharesAccountId);
      } else {
        const account = sharesAccount.value;
        if (account?.account.numberOfShares) {
          sharesSold.value = account.account.numberOfShares.toString();
        }
      }
    }
  }
);

function formatAccountDetails(item: PortfolioItem): string {
  const parts = [];
  if (item.account.accountNumber) parts.push(item.account.accountNumber);
  if (item.account.sortCode) parts.push(item.account.sortCode);
  return parts.length > 0 ? `(${parts.join(' / ')})` : '';
}

async function submit(): Promise<void> {
  if (!canSubmit.value) return;
  const ok = await submitSale({
    sharesAccountId: props.sharesAccountId,
    cashAccountId: cashAccountId.value as number,
    taxLiabilityAccountId: taxAccountId.value as number,
    sharesSold: String(sharesSold.value),
    salePricePerShare: String(salePricePerShare.value),
  });
  if (ok) emit('sold');
}

function emitClose(): void {
  reset();
  sharesSold.value = '';
  salePricePerShare.value = '';
  cashAccountId.value = '';
  taxAccountId.value = '';
  tab.value = 'record';
  emit('close');
}
</script>
