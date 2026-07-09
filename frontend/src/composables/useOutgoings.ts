import { ref, computed } from 'vue';
import { apiService } from '@services/ApiService';
import { isOutgoingAccountType } from '@composables/outgoingTypes';
import { annualCost, computePredictedAnnualTotal } from '@composables/outgoingBudget';
import { matchesAccountSearch } from '@/utils/accountSearch';
import type { PortfolioItem, Account } from '@models/WealthTrackDataModels';
import type { SavePayload } from '@views/AccountHub/accountModalSave';
import { debug } from '@utils/debug';

export interface OutgoingsStats {
  totalMonthlyGbp: number;
  totalAnnualGbp: number;
  predictedMonthlyGbp: number;
  predictedAnnualGbp: number;
  renewingSoonCount: number;
  byCategory: { label: string; count: number; monthlyGbp: number }[];
}

export { paymentsPerYear, annualCost } from '@composables/outgoingBudget';

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

/** Compute the Outgoings Hub stats for a set of outgoing items (annualised). */
export function computeOutgoingsStats(
  active: PortfolioItem[],
  projections: Record<number, string> = {},
): OutgoingsStats {
  let totalAnnual = 0;
  const categoryMap: Record<string, { count: number; annual: number }> = {};

  for (const item of active) {
    const annual = annualCost(item);
    totalAnnual += annual;

    const cat = item.accountType ?? 'Other';
    if (!categoryMap[cat]) categoryMap[cat] = { count: 0, annual: 0 };
    categoryMap[cat].count += 1;
    categoryMap[cat].annual += annual;
  }

  const byCategory = Object.entries(categoryMap).map(([label, v]) => ({
    label,
    count: v.count,
    monthlyGbp: v.annual / 12,
  }));

  const renewingSoonCount = active.filter((i) =>
    isRenewingWithin30Days(i.account.renewalDate)
  ).length;

  const predictedAnnual = computePredictedAnnualTotal(active, projections);

  return {
    totalMonthlyGbp: totalAnnual / 12,
    totalAnnualGbp: totalAnnual,
    predictedMonthlyGbp: predictedAnnual / 12,
    predictedAnnualGbp: predictedAnnual,
    renewingSoonCount,
    byCategory,
  };
}

/** Filter a portfolio to just its outgoing items. */
export function filterOutgoings(items: PortfolioItem[]): PortfolioItem[] {
  return items.filter((i) => isOutgoingAccountType(i.accountType));
}

/**
 * Filter outgoings by a search query (name/provider/type/account no./sort code)
 * and sort them in a sensible order: by type, then provider, then account name.
 */
export function searchAndSortOutgoings(
  items: PortfolioItem[], query: string,
): PortfolioItem[] {
  const q = query.trim().toLowerCase();
  const matched = items.filter((item) =>
    matchesAccountSearch(query, {
      institutionName: item.institution?.name,
      accountName: item.account.name,
      accountNumber: item.account.accountNumber,
      sortCode: item.account.sortCode,
    }) || (!!q && (item.accountType ?? '').toLowerCase().includes(q)));
  return [...matched].sort((a, b) =>
    (a.accountType ?? '').localeCompare(b.accountType ?? '')
    || (a.institution?.name ?? '').localeCompare(b.institution?.name ?? '')
    || a.account.name.localeCompare(b.account.name));
}

export function useOutgoings(): {
  items: import('vue').Ref<PortfolioItem[]>;
  outgoingItems: import('vue').ComputedRef<PortfolioItem[]>;
  stats: import('vue').ComputedRef<OutgoingsStats>;
  projections: import('vue').Ref<Record<number, string>>;
  loading: import('vue').Ref<boolean>;
  error: import('vue').Ref<string | null>;
  loadPortfolio: () => Promise<void>;
  loadProjections: () => Promise<void>;
  createAccount: (payload: SavePayload) => Promise<Account | null>;
  updateAccount: (accountId: number, payload: SavePayload) => Promise<boolean>;
  deleteAccount: (accountId: number) => Promise<boolean>;
} {
  const items = ref<PortfolioItem[]>([]);
  const projections = ref<Record<number, string>>({});
  const loading = ref(false);
  const error = ref<string | null>(null);

  const outgoingItems = computed(() => filterOutgoings(items.value));

  const stats = computed<OutgoingsStats>(() => {
    return computeOutgoingsStats(outgoingItems.value, projections.value);
  });

  async function loadPortfolio(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const portfolio = await apiService.getPortfolio();
      items.value = portfolio.items ?? [];
      await loadProjections();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load outgoings';
      debug.error('[useOutgoings] load error', e);
    } finally {
      loading.value = false;
    }
  }

  async function loadProjections(): Promise<void> {
    try {
      const list = await apiService.getOutgoingProjections();
      projections.value = Object.fromEntries(list.map((p) => [p.accountId, p.projectedCost]));
    } catch (e) {
      debug.error('[useOutgoings] projections load error', e);
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
    projections,
    loading,
    error,
    loadPortfolio,
    loadProjections,
    createAccount,
    updateAccount,
    deleteAccount,
  };
}
