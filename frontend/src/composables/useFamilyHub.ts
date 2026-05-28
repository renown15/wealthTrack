import { reactive, computed } from 'vue';
import { apiService } from '@services/ApiService';
import { debug } from '@utils/debug';
import type { Family, FamilyMember } from '@models/family';
import type { Portfolio } from '@models/WealthTrackDataModels';

interface MemberPortfolioState {
  portfolio: Portfolio | null;
  loading: boolean;
  error: string | null;
}

export interface FamilyHubState {
  family: Family | null;
  loading: boolean;
  error: string | null;
  memberPortfolios: Record<number, MemberPortfolioState>;
}

export function useFamilyHub(getCurrentUserId: () => number): {
  state: FamilyHubState;
  loadFamily: () => Promise<void>;
  otherMembers: import('vue').ComputedRef<FamilyMember[]>;
  loadMemberPortfolio: (accountId: number) => Promise<void>;
  loadAllMemberPortfolios: () => Promise<void>;
} {
  const state = reactive<FamilyHubState>({
    family: null,
    loading: false,
    error: null,
    memberPortfolios: {},
  });

  const loadFamily = async (): Promise<void> => {
    state.loading = true;
    state.error = null;
    try {
      const families = await apiService.getFamilies();
      state.family = families[0] ?? null;
    } catch (err) {
      state.error = err instanceof Error ? err.message : 'Failed to load family';
      debug.error('[useFamilyHub] loadFamily error:', err);
      state.family = null;
    } finally {
      state.loading = false;
    }
  };

  const otherMembers = computed<FamilyMember[]>(() => {
    if (!state.family) return [];
    return state.family.members.filter((m) => m.accountId !== getCurrentUserId());
  });

  const loadMemberPortfolio = async (accountId: number): Promise<void> => {
    if (!state.family) return;
    state.memberPortfolios[accountId] = { portfolio: null, loading: true, error: null };
    try {
      const portfolio = await apiService.getFamilyMemberPortfolio(state.family.id, accountId);
      state.memberPortfolios[accountId] = { portfolio, loading: false, error: null };
    } catch (err) {
      state.memberPortfolios[accountId] = {
        portfolio: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load portfolio',
      };
      debug.error('[useFamilyHub] loadMemberPortfolio error:', err);
    }
  };

  const loadAllMemberPortfolios = async (): Promise<void> => {
    const unloaded = otherMembers.value.filter((m) => !state.memberPortfolios[m.accountId]);
    await Promise.all(unloaded.map((m) => loadMemberPortfolio(m.accountId)));
  };

  return { state, loadFamily, otherMembers, loadMemberPortfolio, loadAllMemberPortfolios };
}
