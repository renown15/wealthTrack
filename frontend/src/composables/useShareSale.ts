import { ref } from 'vue';
import { apiService } from '@services/ApiService';
import { debug } from '@utils/debug';
import type { ShareSaleResponse, ShareSaleSummary } from '@models/ShareSaleModels';
import type { PortfolioItem } from '@models/WealthTrackDataModels';

export function useShareSale() {
  const submitting = ref(false);
  const error = ref<string | null>(null);
  const result = ref<ShareSaleResponse | null>(null);
  const history = ref<ShareSaleSummary[]>([]);
  const historyLoading = ref(false);

  const cashAccountTypes = ['Current Account', 'Savings Account', 'Fixed / Bonus Rate Savings', 'Cash ISA'];

  function getCashAccounts(items: PortfolioItem[]): PortfolioItem[] {
    return items.filter((i) => cashAccountTypes.includes(i.accountType ?? ''));
  }

  function getTaxAccounts(items: PortfolioItem[]): PortfolioItem[] {
    return items.filter((i) => i.accountType === 'Tax Liability');
  }

  async function loadHistory(accountId: number): Promise<void> {
    historyLoading.value = true;
    try {
      history.value = await apiService.getShareSaleHistory(accountId);
    } catch (e) {
      debug.error('[useShareSale] Failed to load history:', e);
    } finally {
      historyLoading.value = false;
    }
  }

  async function submitSale(payload: {
    sharesAccountId: number;
    cashAccountId: number;
    taxLiabilityAccountId: number;
    sharesSold: string;
    salePricePerShare: string;
  }): Promise<boolean> {
    submitting.value = true;
    error.value = null;
    result.value = null;
    try {
      result.value = await apiService.recordShareSale({
        sharesAccountId: payload.sharesAccountId,
        cashAccountId: payload.cashAccountId,
        taxLiabilityAccountId: payload.taxLiabilityAccountId,
        sharesSold: payload.sharesSold,
        salePricePerShare: payload.salePricePerShare,
      });
      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to record sale';
      error.value = errorMsg;
      debug.error('[useShareSale] Share sale submission failed:', { error: errorMsg, payload });
      return false;
    } finally {
      submitting.value = false;
    }
  }

  function reset(): void {
    submitting.value = false;
    error.value = null;
    result.value = null;
    history.value = [];
  }

  return {
    submitting, error, result, history, historyLoading,
    getCashAccounts, getTaxAccounts, loadHistory, submitSale, reset,
  };
}
