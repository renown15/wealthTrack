/**
 * Handles account balance update and win event actions for the AccountHub.
 */
import type { Ref } from 'vue';
import type { PortfolioItem } from '@/models/WealthTrackDataModels';
import { apiService } from '@/services/ApiService';
import { debug } from '@/utils/debug';

interface PortfolioState {
  items: PortfolioItem[];
  error: string | null;
}

export function useHubEventHandlers(
  state: PortfolioState,
  loadPortfolio: () => Promise<void>,
  currentAccountId: Ref<number>,
  accountType: Ref<string | undefined>,
  openEventsModal: (id: number, name: string, type?: string) => Promise<void>,
): {
  handleUpdateBalance: (accountId: number, value: string) => Promise<void>;
  handleAddWin: (winAmount: string) => Promise<void>;
} {
  const handleUpdateBalance = async (accountId: number, value: string): Promise<void> => {
    try {
      const grossValue = parseFloat(value);
      if (Number.isNaN(grossValue)) { state.error = 'Invalid balance value'; return; }
      const item = state.items.find(i => i.account.id === accountId);
      const encumbrance = item?.account.encumbrance;
      if (encumbrance) {
        await apiService.updateAccount(accountId, { encumbrance, newGrossBalance: grossValue.toString() });
        await loadPortfolio();
      } else {
        await apiService.createAccountEvent(accountId, { event_type: 'Balance', value: grossValue.toString() });
        if (item) {
          const now = new Date().toISOString();
          item.latestBalance = { id: item.latestBalance?.id ?? 0, accountId, userId: item.latestBalance?.userId ?? 0, eventType: 'Balance', value: grossValue.toString(), createdAt: now, updatedAt: now };
        }
      }
    } catch (error) { state.error = error instanceof Error ? error.message : 'Failed to update balance'; }
  };

  const handleAddWin = async (winAmount: string): Promise<void> => {
    try {
      await apiService.createAccountEvent(currentAccountId.value, { event_type: 'Win', value: winAmount });
      await loadPortfolio();
      const accountName = state.items.find(item => item.account.id === currentAccountId.value)?.account.name || 'Account';
      await openEventsModal(currentAccountId.value, accountName, accountType.value);
    } catch (error) { debug.error('[AccountHub] Failed to add win event:', error); }
  };

  return { handleUpdateBalance, handleAddWin };
}
