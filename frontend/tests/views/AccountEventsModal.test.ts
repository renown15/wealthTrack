import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AccountEventsModal from '@/views/AccountHub/AccountEventsModal.vue';
import type { AccountEvent } from '@/models/Portfolio';

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
  {
    id: 2,
    accountId: 1,
    userId: 1,
    eventType: 'interest_payment',
    value: '',
    createdAt: '2025-01-02T12:00:00Z',
    updatedAt: '2025-01-02T12:00:00Z',
  },
];

describe('AccountEventsModal', () => {
  it('renders events list with formatted values', () => {
    const wrapper = mount(AccountEventsModal, {
      props: {
        open: true,
        title: 'Event log',
        events: sampleEvents,
        loading: false,
      },
    });

    const rows = wrapper.findAll('.event-row');
    expect(rows.length).toBe(2);
    expect(rows[0].text()).toContain('balance_update');
    expect(rows[0].text()).toContain('$1,000.00');
    expect(rows[1].text()).toContain('interest_payment');
    expect(rows[1].text()).toContain('—');
    const expectedDate = new Date(sampleEvents[0].createdAt).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    expect(rows[0].text()).toContain(expectedDate);
  });

  it('renders loading, error, and empty states', () => {
    const loadingWrapper = mount(AccountEventsModal, {
      props: { open: true, title: 'Events', events: [], loading: true },
    });
    expect(loadingWrapper.find('.events-loading').exists()).toBe(true);

    const errorWrapper = mount(AccountEventsModal, {
      props: { open: true, title: 'Events', events: [], loading: false, error: 'boom' },
    });
    expect(errorWrapper.find('.events-error').text()).toContain('boom');

    const emptyWrapper = mount(AccountEventsModal, {
      props: { open: true, title: 'Events', events: [], loading: false },
    });
    expect(emptyWrapper.find('.events-empty').exists()).toBe(true);
  });

  it('emits close when overlay or close button clicked', async () => {
    const wrapper = mount(AccountEventsModal, {
      props: { open: true, title: 'Events', events: sampleEvents, loading: false },
    });

    await wrapper.get('.modal-overlay').trigger('click');
    await wrapper.get('.btn-close').trigger('click');

    expect(wrapper.emitted().close).toHaveLength(2);
  });

  it('formatCurrency handles falsy and invalid values', () => {
    const wrapper = mount(AccountEventsModal, {
      props: { open: true, title: 'Events', events: [], loading: false },
    });

    const vm = wrapper.vm as unknown as { formatCurrency: (value: string | null) => string };
    expect(vm.formatCurrency(null)).toBe('—');
    expect(vm.formatCurrency('abc')).toBe('abc');
  });
});
