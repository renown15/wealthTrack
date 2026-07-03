import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useHubEventHandlers } from '@composables/useHubEventHandlers';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    createAccountEvent: vi.fn(),
    updateAccount: vi.fn(),
  },
}));

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

  beforeEach(() => {
    vi.clearAllMocks();
    mockShowError.mockReset();
    state = makeState();
    loadPortfolio = vi.fn().mockResolvedValue(undefined);
    api.createAccountEvent.mockResolvedValue(undefined as never);
    api.updateAccount.mockResolvedValue(undefined as never);
  });

  const handlers = () => useHubEventHandlers(state, loadPortfolio);

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
});
