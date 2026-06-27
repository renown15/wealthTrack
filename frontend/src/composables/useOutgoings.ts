import { ref, computed } from 'vue';
import { apiService } from '@services/ApiService';
import { OUTGOING_TYPES } from '@composables/portfolioCalculations';
import type { PortfolioItem, Account } from '@models/WealthTrackDataModels';
import type { SavePayload } from '@views/AccountHub/accountModalSave';
import { debug } from '@utils/debug';

export interface OutgoingsStats {
  totalMonthlyGbp: number;
  totalAnnualGbp: number;
  renewingSoonCount: number;
  byCategory: { label: string; count: number; monthlyGbp: number }[];
}

export function isRenewingWithin30Days(renewalDate: string | null | undefined): boolean {
  if (!renewalDate) return false;
  const parts = renewalDate.split('/');
  if (parts.length !== 3) return false;
  const parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  if (isNaN(parsed.getTime())) return false;
  const now = new Date();
  const diffMs = parsed.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 30;
}

export function formatRenewalDate(renewalDate: string | null | undefined): string {
  if (!renewalDate) return '—';
  const parts = renewalDate.split('/');
  if (parts.length !== 3) return renewalDate;
  return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function useOutgoings(): {
  items: import('vue').Ref<PortfolioItem[]>;
  outgoingItems: import('vue').ComputedRef<PortfolioItem[]>;
  stats: import('vue').ComputedRef<OutgoingsStats>;
  loading: import('vue').Ref<boolean>;
  error: import('vue').Ref<string | null>;
  loadPortfolio: () => Promise<void>;
  createAccount: (payload: SavePayload) => Promise<Account | null>;
  updateAccount: (accountId: number, payload: SavePayload) => Promise<boolean>;
  deleteAccount: (accountId: number) => Promise<boolean>;
} {
  const items = ref<PortfolioItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const outgoingItems = computed(() =>
    items.value.filter((i) => OUTGOING_TYPES.includes(i.accountType ?? ''))
  );

  const stats = computed<OutgoingsStats>(() => {
    const active = outgoingItems.value;
    let totalMonthly = 0;
    const categoryMap: Record<string, { count: number; monthly: number }> = {};

    for (const item of active) {
      const cost = parseFloat(item.account.monthlyCost ?? '');
      if (!isNaN(cost)) totalMonthly += cost;

      const cat = item.accountType ?? 'Other';
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, monthly: 0 };
      categoryMap[cat].count += 1;
      if (!isNaN(cost)) categoryMap[cat].monthly += cost;
    }

    const byCategory = Object.entries(categoryMap).map(([label, v]) => ({
      label,
      count: v.count,
      monthlyGbp: v.monthly,
    }));

    const renewingSoonCount = active.filter((i) =>
      isRenewingWithin30Days(i.account.renewalDate)
    ).length;

    return {
      totalMonthlyGbp: totalMonthly,
      totalAnnualGbp: totalMonthly * 12,
      renewingSoonCount,
      byCategory,
    };
  });

  async function loadPortfolio(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const portfolio = await apiService.getPortfolio();
      items.value = portfolio.items ?? [];
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load outgoings';
      debug.error('[useOutgoings] load error', e);
    } finally {
      loading.value = false;
    }
  }

  async function createAccount(payload: SavePayload): Promise<Account | null> {
    try {
      const account = await apiService.createAccount(payload as never);
      await loadPortfolio();
      return account;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create account';
      debug.error('[useOutgoings] create error', e);
      return null;
    }
  }

  async function updateAccount(accountId: number, payload: SavePayload): Promise<boolean> {
    try {
      await apiService.updateAccount(accountId, payload as never);
      await loadPortfolio();
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update account';
      debug.error('[useOutgoings] update error', e);
      return false;
    }
  }

  async function deleteAccount(accountId: number): Promise<boolean> {
    try {
      await apiService.deleteAccount(accountId);
      items.value = items.value.filter((i) => i.account.id !== accountId);
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete account';
      debug.error('[useOutgoings] delete error', e);
      return false;
    }
  }

  return {
    items,
    outgoingItems,
    stats,
    loading,
    error,
    loadPortfolio,
    createAccount,
    updateAccount,
    deleteAccount,
  };
}
