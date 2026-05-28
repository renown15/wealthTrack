import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AccountEventsModal from '@/views/AccountHub/AccountEventsModal.vue';
import type { AccountEvent } from '@/models/WealthTrackDataModels';

const sampleEvents: AccountEvent[] = [
  {
    id: 1,
    accountId: 1,
    userId: 1,
    eventType: 'balance_update',
    value: '1000.00',
    createdAt: '2025-01-01T12:00:00Z',
    updatedAt: '2025-01-01T12:00:00Z',
  },
];

describe('AccountEventsModal', () => {
  it('renders when open is true', () => {
    const wrapper = mount(AccountEventsModal, {
      props: {
        open: true,
        title: 'Event log',
        events: sampleEvents,
        loading: false,
      },
    });

    expect(wrapper.find('.modal-overlay').exists()).toBe(true);
    expect(wrapper.find('.modal-title').exists()).toBe(true);
  });

  it('does not render when open is false', () => {
    const wrapper = mount(AccountEventsModal, {
      props: { open: false, title: 'Events', events: [], loading: false },
    });
    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
  });

  it('emits close when close button clicked', async () => {
    const wrapper = mount(AccountEventsModal, {
      props: { open: true, title: 'Events', events: sampleEvents, loading: false },
    });

    await wrapper.get('.btn-close').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('shows delete button only for Gift events', async () => {
    const events = [
      { ...sampleEvents[0], id: 1, eventType: 'Gift', source: 'event' },
      { ...sampleEvents[0], id: 2, eventType: 'Balance Update', source: 'event' },
    ] as never;
    const wrapper = mount(AccountEventsModal, {
      props: { open: true, title: 'Events', events, loading: false },
    });
    const rows = wrapper.findAll('tbody tr');
    expect(rows[0].find('button[title="Delete gift"]').exists()).toBe(true);
    expect(rows[1].find('button[title="Delete gift"]').exists()).toBe(false);
  });

  it('shows confirm banner and emits deleteGift on confirm', async () => {
    const events = [{ ...sampleEvents[0], id: 5, eventType: 'Gift', source: 'event' }] as never;
    const wrapper = mount(AccountEventsModal, {
      props: { open: true, title: 'Events', events, loading: false },
    });
    await wrapper.find('button[title="Delete gift"]').trigger('click');
    expect(wrapper.text()).toContain('Delete this gift?');
    await wrapper.find('button.btn-danger').trigger('click');
    expect(wrapper.emitted('deleteGift')?.[0]).toEqual([5]);
  });
});


