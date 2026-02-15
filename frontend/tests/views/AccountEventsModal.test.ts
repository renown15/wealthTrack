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
});


