/**
 * Handles account balance update and win event actions for the AccountHub.
 */
import type { Ref } from 'vue';
import type { PortfolioItem } from '@/models/WealthTrackDataModels';
import { apiService } from '@/services/ApiService';
import { debug } from '@/utils/debug';
import type { RecordGiftRequest } from '@/models/gift';
import { useToast } from '@/composables/useToast';

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
  handleSaveDividend: (amount: string, paymentDate: string) => Promise<void>;
  handleSaveGift: (donor: string, giftDate: string, giftValueGbp: string, numShares: string | null) => Promise<void>;
  handleDeleteGift: (eventId: number) => Promise<void>;
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

  const handleAddWin = async (winAmount: string): Promise<void> => {
    try {
      await apiService.createAccountEvent(currentAccountId.value, { eventType: 'Win', value: winAmount });
      await loadPortfolio();
      const accountName = state.items.find(item => item.account.id === currentAccountId.value)?.account.name || 'Account';
      await openEventsModal(currentAccountId.value, accountName, accountType.value);
    } catch (error) { debug.error('[AccountHub] Failed to add win event:', error); }
  };

  const handleSaveDividend = async (amount: string, paymentDate: string): Promise<void> => {
    try {
      await apiService.recordDividend(currentAccountId.value, amount, paymentDate);
      await loadPortfolio();
      const name = state.items.find((i) => i.account.id === currentAccountId.value)?.account.name ?? '';
      await openEventsModal(currentAccountId.value, name, accountType.value);
    } catch (error) { debug.error('[AccountHub] Failed to record dividend:', error); }
  };

  const handleSaveGift = async (donor: string, giftDate: string, giftValueGbp: string, numShares: string | null): Promise<void> => {
    try {
      const data: RecordGiftRequest = { donor, giftDate, giftValueGbp, numShares };
      await apiService.recordGift(currentAccountId.value, data);
      await loadPortfolio();
      const name = state.items.find((i) => i.account.id === currentAccountId.value)?.account.name ?? '';
      await openEventsModal(currentAccountId.value, name, accountType.value);
    } catch (error) { debug.error('[AccountHub] Failed to record gift:', error); }
  };

  const handleDeleteGift = async (eventId: number): Promise<void> => {
    try {
      await apiService.deleteGiftByEventId(eventId);
      await loadPortfolio();
      const name = state.items.find((i) => i.account.id === currentAccountId.value)?.account.name ?? '';
      await openEventsModal(currentAccountId.value, name, accountType.value);
    } catch (error) { debug.error('[AccountHub] Failed to delete gift:', error); }
  };

  return { handleUpdateBalance, handleAddWin, handleSaveDividend, handleSaveGift, handleDeleteGift };
}
