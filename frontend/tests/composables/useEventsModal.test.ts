import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEventsModal } from '@composables/useEventsModal';
import { apiService } from '@services/ApiService';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    getAccountEvents: vi.fn(),
  },
}));

const mockApi = vi.mocked(apiService);

const mockEvents = [
  { id: 1, accountId: 10, userId: 1, eventType: 'balance', value: '1000', createdAt: '', updatedAt: '' },
  { id: 2, accountId: 10, userId: 1, eventType: 'balance', value: '1200', createdAt: '', updatedAt: '' },
];

describe('useEventsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('openEventsModal', () => {
    it('opens modal, sets title, and loads events on success', async () => {
      mockApi.getAccountEvents.mockResolvedValue(mockEvents);
      const m = useEventsModal();

      await m.openEventsModal(10, 'My Savings', 'Premium Bonds');

      expect(m.eventsModalOpen.value).toBe(true);
      expect(m.eventsTitle.value).toBe('My Savings · Events');
      expect(m.events.value).toEqual(mockEvents);
      expect(m.eventsLoading.value).toBe(false);
      expect(m.eventsError.value).toBeUndefined();
      expect(m.accountType.value).toBe('Premium Bonds');
      expect(m.currentAccountId.value).toBe(10);
    });

    it('sets eventsError when fetch fails', async () => {
      mockApi.getAccountEvents.mockRejectedValue(new Error('Network timeout'));
      const m = useEventsModal();

      await m.openEventsModal(10, 'Savings');

      expect(m.eventsModalOpen.value).toBe(true);
      expect(m.eventsError.value).toBe('Network timeout');
      expect(m.events.value).toEqual([]);
      expect(m.eventsLoading.value).toBe(false);
    });

    it('handles non-Error thrown values', async () => {
      mockApi.getAccountEvents.mockRejectedValue('Unknown');
      const m = useEventsModal();

      await m.openEventsModal(10, 'Savings');

      expect(m.eventsError.value).toBe('Unable to load events');
    });
  });

  describe('closeEventsModal', () => {
    it('resets all state', async () => {
      mockApi.getAccountEvents.mockResolvedValue(mockEvents);
      const m = useEventsModal();
      await m.openEventsModal(10, 'Savings', 'Premium Bonds');

      m.closeEventsModal();

      expect(m.eventsModalOpen.value).toBe(false);
      expect(m.events.value).toEqual([]);
      expect(m.eventsError.value).toBeUndefined();
      expect(m.accountType.value).toBeUndefined();
      expect(m.currentAccountId.value).toBe(0);
    });
  });
});
