<template>
  <div>
    <AccountEventsModal
      :open="open" :title="title" :events="events"
      :loading="loading" :error="error ?? undefined" :account-type="accountType"
      @close="emit('close')" @add-win="onAddWin"
      @record-sale="openSale('record')" @view-sales="openSale('history')"
      @record-dividend="dividendOpen = true" @record-gift="giftOpen = true"
      @delete-gift="onDeleteGift"
    />
    <RecordDividendModal
      :open="dividendOpen"
      @close="dividendOpen = false"
      @save="onSaveDividend"
    />
    <GiftModal
      :open="giftOpen" :account-type="accountType"
      @close="giftOpen = false"
      @save="onSaveGift"
    />
    <ShareSaleModal
      :open="saleOpen" :shares-account-id="currentAccountId" :all-items="items" :start-tab="saleTab"
      @close="saleOpen = false"
      @sold="onSold"
      @reversed="onReversed"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Shared owner of the account events timeline and every action reachable from
 * it (Record Dividend / Gift / Sale, View Sales, Add Win, delete gift).
 *
 * Both AccountHub and TaxHub embed this, so the button wiring AND the mutation
 * calls live in exactly one place — a host can't half-wire the modal and leave
 * dead buttons. Hosts only handle `close` and `changed`; `changed` fires after
 * any successful mutation so the host can reload its own data and refresh the
 * timeline.
 */
import { ref } from 'vue';
import type { AccountEvent, PortfolioItem } from '@/models/WealthTrackDataModels';
import type { RecordGiftRequest } from '@/models/gift';
import { apiService } from '@/services/ApiService';
import { debug } from '@/utils/debug';
import AccountEventsModal from '@views/AccountHub/AccountEventsModal.vue';
import RecordDividendModal from '@views/AccountHub/RecordDividendModal.vue';
import GiftModal from '@views/AccountHub/GiftModal.vue';
import ShareSaleModal from '@views/AccountHub/ShareSaleModal.vue';

const props = defineProps<{
  open: boolean;
  title: string;
  events: AccountEvent[];
  loading: boolean;
  error?: string | null;
  accountType?: string;
  currentAccountId: number;
  items: PortfolioItem[];
}>();

const emit = defineEmits<{ close: []; changed: [] }>();

const dividendOpen = ref(false);
const giftOpen = ref(false);
const saleOpen = ref(false);
const saleTab = ref<'record' | 'history'>('record');

const openSale = (tab: 'record' | 'history'): void => {
  saleTab.value = tab;
  saleOpen.value = true;
};

const onAddWin = async (value: string): Promise<void> => {
  try {
    await apiService.createAccountEvent(props.currentAccountId, { eventType: 'Win', value });
    emit('changed');
  } catch (error) { debug.error('[AccountEvents] Failed to add win:', error); }
};

const onSaveDividend = async (amount: string, paymentDate: string): Promise<void> => {
  dividendOpen.value = false;
  try {
    await apiService.recordDividend(props.currentAccountId, amount, paymentDate);
    emit('changed');
  } catch (error) { debug.error('[AccountEvents] Failed to record dividend:', error); }
};

const onSaveGift = async (donor: string, giftDate: string, giftValueGbp: string, numShares: string | null): Promise<void> => {
  giftOpen.value = false;
  const data: RecordGiftRequest = { donor, giftDate, giftValueGbp, numShares };
  try {
    await apiService.recordGift(props.currentAccountId, data);
    emit('changed');
  } catch (error) { debug.error('[AccountEvents] Failed to record gift:', error); }
};

const onDeleteGift = async (eventId: number): Promise<void> => {
  try {
    await apiService.deleteGiftByEventId(eventId);
    emit('changed');
  } catch (error) { debug.error('[AccountEvents] Failed to delete gift:', error); }
};

const onSold = (): void => { saleOpen.value = false; emit('changed'); };
const onReversed = (): void => { emit('changed'); };
</script>
