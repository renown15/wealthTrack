/**
 * Handles account balance updates for the AccountHub.
 *
 * Events-timeline actions (dividend, gift, win, share sale, delete gift) live in
 * AccountEventsGroup.vue, which owns both their wiring and their API calls.
 */
import type { PortfolioItem } from '@/models/WealthTrackDataModels';
import { apiService } from '@/services/ApiService';
import { useToast } from '@/composables/useToast';

interface PortfolioState {
  items: PortfolioItem[];
  error: string | null;
}

export function useHubEventHandlers(
  state: PortfolioState,
  loadPortfolio: () => Promise<void>,
): {
  handleUpdateBalance: (accountId: number, value: string) => Promise<void>;
} {
  const { showError } = useToast();

  const handleUpdateBalance = async (accountId: number, value: string): Promise<void> => {
    try {
      const grossValue = parseFloat(value);
      if (Number.isNaN(grossValue)) { showError('Invalid balance value'); return; }
      const item = state.items.find(i => i.account.id === accountId);
      const encumbrance = item?.account.encumbrance;
      if (encumbrance) {
        await apiService.updateAccount(accountId, { encumbrance, newGrossBalance: grossValue.toString() });
        await loadPortfolio();
      } else {
        await apiService.createAccountEvent(accountId, { eventType: 'Balance', value: grossValue.toString() });
        if (item) {
          const now = new Date().toISOString();
          item.latestBalance = { id: item.latestBalance?.id ?? 0, accountId, userId: item.latestBalance?.userId ?? 0, eventType: 'Balance', value: grossValue.toString(), createdAt: now, updatedAt: now };
        }
      }
    } catch (error) { showError(error instanceof Error ? error.message : 'Failed to update balance'); }
  };

  return { handleUpdateBalance };
}
