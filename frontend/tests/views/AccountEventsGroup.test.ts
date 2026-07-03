import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import AccountEventsGroup from '@/views/AccountHub/AccountEventsGroup.vue';
import AccountEventsModal from '@/views/AccountHub/AccountEventsModal.vue';
import RecordDividendModal from '@/views/AccountHub/RecordDividendModal.vue';
import GiftModal from '@/views/AccountHub/GiftModal.vue';
import ShareSaleModal from '@/views/AccountHub/ShareSaleModal.vue';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    createAccountEvent: vi.fn(),
    recordDividend: vi.fn(),
    recordGift: vi.fn(),
    deleteGiftByEventId: vi.fn(),
  },
}));
vi.mock('@/utils/debug', () => ({ debug: { error: vi.fn(), log: vi.fn() } }));

import { apiService } from '@services/ApiService';
const api = vi.mocked(apiService);

const mountGroup = () =>
  mount(AccountEventsGroup, {
    props: {
      open: true, title: 'HSBC Shares · Events', events: [], loading: false,
      error: null, accountType: 'Shares', currentAccountId: 5, items: [],
    },
    global: { stubs: { AccountEventsModal: true, RecordDividendModal: true, GiftModal: true, ShareSaleModal: true } },
  });

describe('AccountEventsGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.createAccountEvent.mockResolvedValue(undefined as never);
    api.recordDividend.mockResolvedValue(undefined as never);
    api.recordGift.mockResolvedValue(undefined as never);
    api.deleteGiftByEventId.mockResolvedValue(undefined as never);
  });

  it('re-emits close from the events modal', async () => {
    const w = mountGroup();
    await w.findComponent(AccountEventsModal).vm.$emit('close');
    expect(w.emitted('close')).toHaveLength(1);
  });

  it('records a dividend and emits changed', async () => {
    const w = mountGroup();
    await w.findComponent(AccountEventsModal).vm.$emit('recordDividend');
    expect(w.findComponent(RecordDividendModal).props('open')).toBe(true);

    await w.findComponent(RecordDividendModal).vm.$emit('save', '150.00', '2026-05-01');
    await flushPromises();

    expect(api.recordDividend).toHaveBeenCalledWith(5, '150.00', '2026-05-01');
    expect(w.emitted('changed')).toHaveLength(1);
    expect(w.findComponent(RecordDividendModal).props('open')).toBe(false);
  });

  it('records a gift and emits changed', async () => {
    const w = mountGroup();
    await w.findComponent(AccountEventsModal).vm.$emit('recordGift');
    expect(w.findComponent(GiftModal).props('open')).toBe(true);

    await w.findComponent(GiftModal).vm.$emit('save', 'Granny', '2026-01-01', '5000', null);
    await flushPromises();

    expect(api.recordGift).toHaveBeenCalledWith(5, {
      donor: 'Granny', giftDate: '2026-01-01', giftValueGbp: '5000', numShares: null,
    });
    expect(w.emitted('changed')).toHaveLength(1);
  });

  it('adds a win event and emits changed', async () => {
    const w = mountGroup();
    await w.findComponent(AccountEventsModal).vm.$emit('addWin', '250');
    await flushPromises();
    expect(api.createAccountEvent).toHaveBeenCalledWith(5, { eventType: 'Win', value: '250' });
    expect(w.emitted('changed')).toHaveLength(1);
  });

  it('deletes a gift and emits changed', async () => {
    const w = mountGroup();
    await w.findComponent(AccountEventsModal).vm.$emit('deleteGift', 42);
    await flushPromises();
    expect(api.deleteGiftByEventId).toHaveBeenCalledWith(42);
    expect(w.emitted('changed')).toHaveLength(1);
  });

  it('opens the share sale modal on the record tab', async () => {
    const w = mountGroup();
    await w.findComponent(AccountEventsModal).vm.$emit('recordSale');
    const sale = w.findComponent(ShareSaleModal);
    expect(sale.props('open')).toBe(true);
    expect(sale.props('startTab')).toBe('record');
    expect(sale.props('sharesAccountId')).toBe(5);
  });

  it('opens the share sale modal on the history tab for View Sales', async () => {
    const w = mountGroup();
    await w.findComponent(AccountEventsModal).vm.$emit('viewSales');
    expect(w.findComponent(ShareSaleModal).props('startTab')).toBe('history');
  });

  it('emits changed and closes the sale modal when a sale completes', async () => {
    const w = mountGroup();
    await w.findComponent(AccountEventsModal).vm.$emit('recordSale');
    await w.findComponent(ShareSaleModal).vm.$emit('sold');
    expect(w.emitted('changed')).toHaveLength(1);
    expect(w.findComponent(ShareSaleModal).props('open')).toBe(false);
  });

  it('emits changed when a sale is reversed', async () => {
    const w = mountGroup();
    await w.findComponent(ShareSaleModal).vm.$emit('reversed');
    expect(w.emitted('changed')).toHaveLength(1);
  });

  it('does not emit changed when the dividend API fails', async () => {
    api.recordDividend.mockRejectedValue(new Error('boom'));
    const w = mountGroup();
    await w.findComponent(AccountEventsModal).vm.$emit('recordDividend');
    await w.findComponent(RecordDividendModal).vm.$emit('save', '1', '2026-05-01');
    await flushPromises();
    expect(w.emitted('changed')).toBeUndefined();
  });
});
