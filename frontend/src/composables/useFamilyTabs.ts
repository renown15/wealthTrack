import { ref, computed } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import type { PortfolioItem, Institution, AccountGroup } from '@models/WealthTrackDataModels';
import type { FamilyMember } from '@models/family';
import { useFamilyHub } from '@composables/useFamilyHub';
import { deriveInstitutions } from '@composables/useFamilyInstitutions';

export type TabMode = number | null | 'all';

export interface FamilyTabsResult {
  otherMembers: ComputedRef<FamilyMember[]>;
  allMembers: ComputedRef<FamilyMember[]>;
  activeMemberId: Ref<TabMode>;
  tableItems: ComputedRef<PortfolioItem[]>;
  activeInstitutions: ComputedRef<Institution[] | null>;
  memberGroups: ComputedRef<AccountGroup[]>;
  memberGroupMembersMap: ComputedRef<Map<number, number[]>>;
  isLoadingMember: ComputedRef<boolean>;
  memberError: ComputedRef<string | null>;
  loadFamilyTabs: () => Promise<void>;
  selectMember: (id: TabMode) => void;
  familyId: ComputedRef<number | null>;
  reloadMemberPortfolio: (memberId: number) => Promise<void>;
}

interface CurrentUser {
  firstName: string;
  lastName: string;
}

export function useFamilyTabs(
  getCurrentUserId: () => number,
  getCurrentUser: () => CurrentUser,
  rawItems: ComputedRef<PortfolioItem[]>,
): FamilyTabsResult {
  const { state, loadFamily, otherMembers, loadMemberPortfolio, loadAllMemberPortfolios } =
    useFamilyHub(getCurrentUserId);
  const familyId = computed<number | null>(() => state.family?.id ?? null);
  const activeMemberId = ref<TabMode>(null);

  const allMembers = computed<FamilyMember[]>(() => {
    const user = getCurrentUser();
    const me: FamilyMember = {
      id: 0,
      accountId: getCurrentUserId(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: '',
    };
    return [me, ...otherMembers.value];
  });

  const selectMember = (id: TabMode): void => {
    activeMemberId.value = id;
    if (id === 'all') {
      void loadAllMemberPortfolios();
    } else if (id !== null && !state.memberPortfolios[id]) {
      void loadMemberPortfolio(id);
    }
  };

  const tableItems = computed<PortfolioItem[]>(() => {
    if (activeMemberId.value === null) return rawItems.value;
    if (activeMemberId.value === 'all') {
      const combined = [...rawItems.value];
      for (const m of otherMembers.value) {
        combined.push(...(state.memberPortfolios[m.accountId]?.portfolio?.items ?? []));
      }
      return combined;
    }
    return state.memberPortfolios[activeMemberId.value]?.portfolio?.items ?? [];
  });

  const activeInstitutions = computed<Institution[] | null>(() => {
    if (activeMemberId.value === null) return null;
    return deriveInstitutions(tableItems.value);
  });

  const isLoadingMember = computed<boolean>(() => {
    if (activeMemberId.value === null) return false;
    if (activeMemberId.value === 'all') {
      return otherMembers.value.some((m) => state.memberPortfolios[m.accountId]?.loading ?? false);
    }
    return state.memberPortfolios[activeMemberId.value]?.loading ?? false;
  });

  const memberError = computed<string | null>(() => {
    if (activeMemberId.value === null || activeMemberId.value === 'all') return null;
    return state.memberPortfolios[activeMemberId.value]?.error ?? null;
  });

  const memberGroups = computed<AccountGroup[]>(() => {
    if (activeMemberId.value === null) return [];
    if (activeMemberId.value === 'all')
      return otherMembers.value.flatMap((m) => state.memberPortfolios[m.accountId]?.portfolio?.groups ?? []);
    return state.memberPortfolios[activeMemberId.value]?.portfolio?.groups ?? [];
  });

  const memberGroupMembersMap = computed<Map<number, number[]>>(() => {
    if (activeMemberId.value === null) return new Map();
    if (activeMemberId.value === 'all') {
      const map = new Map<number, number[]>();
      otherMembers.value.forEach((m) => {
        const raw = state.memberPortfolios[m.accountId]?.portfolio?.groupMembers ?? {};
        Object.entries(raw).forEach(([k, v]) => map.set(Number(k), v));
      });
      return map;
    }
    const raw = state.memberPortfolios[activeMemberId.value]?.portfolio?.groupMembers ?? {};
    return new Map(Object.entries(raw).map(([k, v]) => [Number(k), v]));
  });

  return {
    otherMembers,
    allMembers,
    activeMemberId,
    tableItems,
    activeInstitutions,
    memberGroups,
    memberGroupMembersMap,
    isLoadingMember,
    memberError,
    loadFamilyTabs: loadFamily,
    selectMember,
    familyId,
    reloadMemberPortfolio: loadMemberPortfolio,
  };
}
