import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AccountEventsModal from '@/views/AccountHub/AccountEventsModal.vue';
import type { AccountEvent } from '@/models/WealthTrackDataModels';

const makeEvent = (overrides: Partial<AccountEvent> = {}): AccountEvent => ({
  id: 1,
  accountId: 1,
  userId: 1,
  eventType: 'Balance Update',
  value: '1500.00',
  createdAt: '2025-01-15T10:30:00Z',
  updatedAt: '2025-01-15T10:30:00Z',
  source: 'event',
  ...overrides,
});

describe('AccountEventsModal – additional function coverage', () => {
  describe('formatDate', () => {
    it('formats ISO datetime strings with month name', () => {
      const wrapper = mount(AccountEventsModal, {
        props: { open: true, title: 'T', events: [makeEvent()], loading: false },
      });
      const dateCell = wrapper.find('tbody td');
      expect(dateCell.text()).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
    });

    it('formats date-only strings without time part', () => {
      const event = makeEvent({ paymentDate: '2025-03-20', createdAt: '2025-03-20' });
      const wrapper = mount(AccountEventsModal, {
        props: { open: true, title: 'T', events: [event], loading: false },
      });
      expect(wrapper.find('tbody td').text()).toContain('2025');
    });
  });

  describe('formatValue', () => {
    it('formats numeric event value as GBP currency', () => {
      const wrapper = mount(AccountEventsModal, {
        props: { open: true, title: 'T', events: [makeEvent({ value: '1500.00' })], loading: false },
      });
      const valueCell = wrapper.findAll('tbody td')[2];
      expect(valueCell.text()).toContain('£');
      expect(valueCell.text()).toContain('1,500');
    });

    it('returns attribute value as-is without currency formatting', () => {
      const event = makeEvent({ value: '2025-04-01', source: 'attribute', eventType: 'Payment Date' });
      const wrapper = mount(AccountEventsModal, {
        props: { open: true, title: 'T', events: [event], loading: false },
      });
      const valueCell = wrapper.findAll('tbody td')[2];
      expect(valueCell.text()).toBe('2025-04-01');
    });

    it('returns Share Sale value as a raw count not currency', () => {
      const event = makeEvent({ value: '50', eventType: 'Share Sale', source: 'event' });
      const wrapper = mount(AccountEventsModal, {
        props: { open: true, title: 'T', events: [event], loading: false },
      });
      const valueCell = wrapper.findAll('tbody td')[2];
      expect(valueCell.text()).toBe('50');
    });

    it('shows — when value is empty', () => {
      const event = makeEvent({ value: '' });
      const wrapper = mount(AccountEventsModal, {
        props: { open: true, title: 'T', events: [event], loading: false },
      });
      const valueCell = wrapper.findAll('tbody td')[2];
      expect(valueCell.text()).toBe('—');
    });
  });

  describe('isShares computed', () => {
    it('shows Record Sale, View Sales, Record Dividend buttons', () => {
      const wrapper = mount(AccountEventsModal, {
        props: { open: true, title: 'T', events: [], loading: false, accountType: 'Shares' },
      });
      expect(wrapper.text()).toContain('Record Sale');
      expect(wrapper.text()).toContain('View Sales');
      expect(wrapper.text()).toContain('Record Dividend');
    });

    it('emits recordSale when Record Sale button clicked', async () => {
      const wrapper = mount(AccountEventsModal, {
        props: { open: true, title: 'T', events: [], loading: false, accountType: 'Shares' },
      });
      const recordSaleBtn = wrapper.findAll('button').find(b => b.text() === 'Record Sale');
      await recordSaleBtn!.trigger('click');
      expect(wrapper.emitted('recordSale')).toHaveLength(1);
    });

    it('emits viewSales and recordDividend', async () => {
      const wrapper = mount(AccountEventsModal, {
        props: { open: true, title: 'T', events: [], loading: false, accountType: 'Shares' },
      });
      const viewBtn = wrapper.findAll('button').find(b => b.text() === 'View Sales');
      const divBtn = wrapper.findAll('button').find(b => b.text() === 'Record Dividend');
      await viewBtn!.trigger('click');
      await divBtn!.trigger('click');
      expect(wrapper.emitted('viewSales')).toHaveLength(1);
      expect(wrapper.emitted('recordDividend')).toHaveLength(1);
    });
  });

  describe('isPremiumBonds computed', () => {
    it('shows Add Win button for Premium Bonds', () => {
      const wrapper = mount(AccountEventsModal, {
        props: { open: true, title: 'T', events: [], loading: false, accountType: 'Premium Bonds' },
      });
      expect(wrapper.text()).toContain('Add Win');
    });

    it('does not show Add Win for non-Premium Bonds', () => {
      const wrapper = mount(AccountEventsModal, {
        props: { open: true, title: 'T', events: [], loading: false, accountType: 'Cash ISA' },
      });
      expect(wrapper.text()).not.toContain('Add Win');
    });
  });

  describe('saveWin / cancelWin', () => {
    it('shows win form when Add Win clicked', async () => {
      const wrapper = mount(AccountEventsModal, {
        props: { open: true, title: 'T', events: [], loading: false, accountType: 'Premium Bonds' },
      });
      await wrapper.findAll('button').find(b => b.text() === 'Add Win')!.trigger('click');
      expect(wrapper.find('input[type="number"]').exists()).toBe(true);
    });

    it('emits addWin with amount and hides form', async () => {
      const wrapper = mount(AccountEventsModal, {
        props: { open: true, title: 'T', events: [], loading: false, accountType: 'Premium Bonds' },
      });
      await wrapper.findAll('button').find(b => b.text() === 'Add Win')!.trigger('click');
      await wrapper.find('input[type="number"]').setValue('250');
      await wrapper.findAll('button').find(b => b.text() === 'Save')!.trigger('click');
      expect(wrapper.emitted('addWin')?.[0]).toEqual(['250']);
      expect(wrapper.find('input[type="number"]').exists()).toBe(false);
    });

    it('cancelWin hides form without emitting', async () => {
      const wrapper = mount(AccountEventsModal, {
        props: { open: true, title: 'T', events: [], loading: false, accountType: 'Premium Bonds' },
      });
      await wrapper.findAll('button').find(b => b.text() === 'Add Win')!.trigger('click');
      await wrapper.findAll('button').find(b => b.text() === 'Cancel')!.trigger('click');
      expect(wrapper.find('input[type="number"]').exists()).toBe(false);
      expect(wrapper.emitted('addWin')).toBeUndefined();
    });
  });

  describe('cancelDeleteGift', () => {
    it('hides confirm dialog when Cancel clicked', async () => {
      const events = [makeEvent({ id: 5, eventType: 'Gift', source: 'event' })];
      const wrapper = mount(AccountEventsModal, {
        props: { open: true, title: 'T', events, loading: false },
      });
      await wrapper.find('button[title="Delete gift"]').trigger('click');
      expect(wrapper.text()).toContain('Delete this gift?');
      await wrapper.findAll('button').find(b => b.text() === 'Cancel')!.trigger('click');
      expect(wrapper.text()).not.toContain('Delete this gift?');
    });
  });

  describe('recordGift emit', () => {
    it('emits recordGift when Record Gift clicked', async () => {
      const wrapper = mount(AccountEventsModal, {
        props: { open: true, title: 'T', events: [], loading: false },
      });
      await wrapper.findAll('button').find(b => b.text() === 'Record Gift')!.trigger('click');
      expect(wrapper.emitted('recordGift')).toHaveLength(1);
    });
  });
});
