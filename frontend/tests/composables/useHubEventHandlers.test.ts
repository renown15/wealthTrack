import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useHubEventHandlers } from '@composables/useHubEventHandlers';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    createAccountEvent: vi.fn(),
    updateAccount: vi.fn(),
    recordDividend: vi.fn(),
    recordGift: vi.fn(),
    deleteGiftByEventId: vi.fn(),
  },
}));

vi.mock('@/utils/debug', () => ({ debug: { error: vi.fn(), log: vi.fn() } }));

const mockShowError = vi.fn();
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ showError: mockShowError }),
}));

import { apiService } from '@services/ApiService';
const api = vi.mocked(apiService);

const item1 = { account: { id: 1, name: 'Current', encumbrance: undefined }, latestBalance: null } as never;
const item2 = { account: { id: 2, name: 'Shares', encumbrance: '1000' }, latestBalance: { id: 10, accountId: 2, userId: 1, eventType: 'Balance', value: '5000', createdAt: '', updatedAt: '' } } as never;

const makeState = (items = [item1, item2]) => ({ items, error: null as string | null });

describe('useHubEventHandlers', () => {
  let state: ReturnType<typeof makeState>;
  let loadPortfolio: ReturnType<typeof vi.fn>;
  let openEventsModal: ReturnType<typeof vi.fn>;
  const currentAccountId = ref(1);
  const accountType = ref<string | undefined>('Current Account');

  beforeEach(() => {
    vi.clearAllMocks();
    mockShowError.mockReset();
    state = makeState();
    loadPortfolio = vi.fn().mockResolvedValue(undefined);
    openEventsModal = vi.fn().mockResolvedValue(undefined);
    api.createAccountEvent.mockResolvedValue(undefined as never);
    api.updateAccount.mockResolvedValue(undefined as never);
    api.recordDividend.mockResolvedValue(undefined as never);
    api.recordGift.mockResolvedValue(undefined as never);
    api.deleteGiftByEventId.mockResolvedValue(undefined as never);
    currentAccountId.value = 1;
    accountType.value = 'Current Account';
  });

  const handlers = () => useHubEventHandlers(state, loadPortfolio, currentAccountId, accountType, openEventsModal);

  // ── handleUpdateBalance ────────────────────────────────────────────────────

  describe('handleUpdateBalance', () => {
    it('calls createAccountEvent when no encumbrance', async () => {
      const { handleUpdateBalance } = handlers();
      await handleUpdateBalance(1, '2000');
      expect(api.createAccountEvent).toHaveBeenCalledWith(1, { eventType: 'Balance', value: '2000' });
    });

    it('updates latestBalance optimistically when item found', async () => {
      const { handleUpdateBalance } = handlers();
      await handleUpdateBalance(1, '2000');
      expect(state.items[0].latestBalance?.value).toBe('2000');
    });

    it('calls updateAccount when encumbrance set', async () => {
      currentAccountId.value = 2;
      const { handleUpdateBalance } = handlers();
      await handleUpdateBalance(2, '3000');
      expect(api.updateAccount).toHaveBeenCalledWith(2, { encumbrance: '1000', newGrossBalance: '3000' });
      expect(loadPortfolio).toHaveBeenCalled();
    });

    it('shows toast error on NaN input', async () => {
      const { handleUpdateBalance } = handlers();
      await handleUpdateBalance(1, 'abc');
      expect(mockShowError).toHaveBeenCalledWith('Invalid balance value');
      expect(api.createAccountEvent).not.toHaveBeenCalled();
    });

    it('shows toast error on API failure', async () => {
      api.createAccountEvent.mockRejectedValue(new Error('Network error'));
      const { handleUpdateBalance } = handlers();
      await handleUpdateBalance(1, '500');
      expect(mockShowError).toHaveBeenCalledWith('Network error');
    });
  });

  // ── handleAddWin ─────────────────────────────────────────────────────────

  describe('handleAddWin', () => {
    it('creates win event, reloads, opens events modal', async () => {
      const { handleAddWin } = handlers();
      await handleAddWin('250');
      expect(api.createAccountEvent).toHaveBeenCalledWith(1, { eventType: 'Win', value: '250' });
      expect(loadPortfolio).toHaveBeenCalled();
      expect(openEventsModal).toHaveBeenCalledWith(1, 'Current', 'Current Account');
    });

    it('uses fallback account name when not found', async () => {
      currentAccountId.value = 99;
      const { handleAddWin } = handlers();
      await handleAddWin('100');
      expect(openEventsModal).toHaveBeenCalledWith(99, 'Account', 'Current Account');
    });

    it('swallows error gracefully', async () => {
      api.createAccountEvent.mockRejectedValue(new Error('fail'));
      const { handleAddWin } = handlers();
      await expect(handleAddWin('100')).resolves.not.toThrow();
    });
  });

  // ── handleSaveDividend ────────────────────────────────────────────────────

  describe('handleSaveDividend', () => {
    it('records dividend, reloads, opens events modal', async () => {
      const { handleSaveDividend } = handlers();
      await handleSaveDividend('500', '2025-04-01');
      expect(api.recordDividend).toHaveBeenCalledWith(1, '500', '2025-04-01');
      expect(loadPortfolio).toHaveBeenCalled();
      expect(openEventsModal).toHaveBeenCalledWith(1, 'Current', 'Current Account');
    });

    it('swallows error gracefully', async () => {
      api.recordDividend.mockRejectedValue(new Error('fail'));
      const { handleSaveDividend } = handlers();
      await expect(handleSaveDividend('500', '2025-04-01')).resolves.not.toThrow();
    });
  });

  // ── handleSaveGift ────────────────────────────────────────────────────────

  describe('handleSaveGift', () => {
    it('records gift, reloads, opens events modal', async () => {
      const { handleSaveGift } = handlers();
      await handleSaveGift('Granny', '2024-01-01', '5000', null);
      expect(api.recordGift).toHaveBeenCalledWith(1, {
        donor: 'Granny', giftDate: '2024-01-01', giftValueGbp: '5000', numShares: null,
      });
      expect(loadPortfolio).toHaveBeenCalled();
      expect(openEventsModal).toHaveBeenCalledWith(1, 'Current', 'Current Account');
    });

    it('swallows error gracefully', async () => {
      api.recordGift.mockRejectedValue(new Error('fail'));
      const { handleSaveGift } = handlers();
      await expect(handleSaveGift('X', '2024-01-01', '100', null)).resolves.not.toThrow();
    });
  });

  // ── handleDeleteGift ──────────────────────────────────────────────────────

  describe('handleDeleteGift', () => {
    it('deletes gift by event id, reloads, opens events modal', async () => {
      const { handleDeleteGift } = handlers();
      await handleDeleteGift(42);
      expect(api.deleteGiftByEventId).toHaveBeenCalledWith(42);
      expect(loadPortfolio).toHaveBeenCalled();
      expect(openEventsModal).toHaveBeenCalledWith(1, 'Current', 'Current Account');
    });

    it('swallows error gracefully', async () => {
      api.deleteGiftByEventId.mockRejectedValue(new Error('fail'));
      const { handleDeleteGift } = handlers();
      await expect(handleDeleteGift(42)).resolves.not.toThrow();
    });
  });
});
