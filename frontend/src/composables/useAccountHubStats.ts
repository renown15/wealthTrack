import { ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import type { PortfolioItem } from '@/models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import { matchesAccountSearch } from '@/utils/accountSearch';
import {
  calculateTotalValue,
  calculateCashAtHand,
  calculateIsaSavings,
  calculateIlliquid,
  calculateTrustAssets,
  calculateProjectedAnnualYield,
  calculatePensionValue,
  type PensionBreakdown,
} from '@composables/portfolioCalculations';

export function useAccountHubStats(
  items: Ref<PortfolioItem[]>,
  accountStatuses: Ref<ReferenceDataItem[]>,
  lifeExpectancy: Ref<number>,
  annuityRate: Ref<number>,
): {
  hideClosed: Ref<boolean>;
  searchText: Ref<string>;
  visibleItems: ComputedRef<PortfolioItem[]>;
  filteredItems: ComputedRef<PortfolioItem[]>;
  totalValue: ComputedRef<number>;
  cashAtHand: ComputedRef<number>;
  isaSavings: ComputedRef<number>;
  illiquid: ComputedRef<number>;
  trustAssets: ComputedRef<number>;
  projectedAnnualYield: ComputedRef<number>;
  pensionBreakdown: ComputedRef<PensionBreakdown>;
} {
  const hideClosed = ref(true);
  const searchText = ref('');

  const visibleItems = computed(() => {
    const closedId = accountStatuses.value.find(s => s.referenceValue === 'Closed')?.id;
    return items.value
      .filter(i => {
        if (hideClosed.value && i.account.statusId === closedId) return false;
        return true;
      })
      .sort((a, b) => {
        const nameA = a.institution?.name ?? '';
        const nameB = b.institution?.name ?? '';
        return nameA.localeCompare(nameB);
      });
  });

  const filteredItems = computed(() =>
    visibleItems.value.filter((i) =>
      matchesAccountSearch(searchText.value, {
        institutionName: i.institution?.name,
        accountName: i.account.name,
        accountNumber: i.account.accountNumber,
        sortCode: i.account.sortCode,
      })
    )
  );

  const totalValue = computed(() => calculateTotalValue(visibleItems.value));
  const cashAtHand = computed(() => calculateCashAtHand(visibleItems.value));
  const isaSavings = computed(() => calculateIsaSavings(visibleItems.value));
  const illiquid = computed(() => calculateIlliquid(visibleItems.value));
  const trustAssets = computed(() => calculateTrustAssets(visibleItems.value));
  const projectedAnnualYield = computed(() => calculateProjectedAnnualYield(visibleItems.value));
  const pensionBreakdown = computed<PensionBreakdown>(() =>
    calculatePensionValue(visibleItems.value, lifeExpectancy.value, annuityRate.value)
  );

  return {
    hideClosed,
    searchText,
    visibleItems,
    filteredItems,
    totalValue,
    cashAtHand,
    isaSavings,
    illiquid,
    trustAssets,
    projectedAnnualYield,
    pensionBreakdown,
  };
}
