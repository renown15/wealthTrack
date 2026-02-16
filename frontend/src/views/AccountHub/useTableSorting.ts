/**
 * Composable for handling table sorting
 */

import { ref, computed, type ComputedRef, type Ref } from 'vue';
import type { PortfolioItem } from '@/models/WealthTrackDataModels';
import { getDisplayBalance } from '@views/AccountHub/accountDisplayUtils';

interface SortState {
  sortBy: Ref<string>;
  sortDirection: Ref<'asc' | 'desc'>;
  setSortBy: (column: string) => void;
  sortedItems: ComputedRef<PortfolioItem[]>;
}

export function useTableSorting(items: PortfolioItem[]): SortState {
  const sortBy = ref<string>('institution');
  const sortDirection = ref<'asc' | 'desc'>('asc');

  const setSortBy = (column: string): void => {
    if (sortBy.value === column) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy.value = column;
      sortDirection.value = 'asc';
    }
  };

  const compareValues = (aVal: unknown, bVal: unknown): number => {
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1;
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1;
    }
    return 0;
  };

  const sortedItems = computed<PortfolioItem[]>(() => {
    const sorted = [...items];

    sorted.sort((a, b) => {
      let aVal: unknown;
      let bVal: unknown;

      switch (sortBy.value) {
        case 'institution':
          aVal = a.institution?.name?.toLowerCase() || 'zzz';
          bVal = b.institution?.name?.toLowerCase() || 'zzz';
          break;
        case 'accountName':
          aVal = a.account.name?.toLowerCase() || '';
          bVal = b.account.name?.toLowerCase() || '';
          break;
        case 'accountType':
          aVal = a.accountType?.toLowerCase() || '';
          bVal = b.accountType?.toLowerCase() || '';
          break;
        case 'balance': {
          const aDisplay = getDisplayBalance(a);
          const bDisplay = getDisplayBalance(b);
          const aNum = aDisplay ? parseFloat(String(aDisplay)) : 0;
          const bNum = bDisplay ? parseFloat(String(bDisplay)) : 0;
          return compareValues(aNum, bNum);
        }
        case 'balanceUpdated':
          aVal = a.latestBalance?.createdAt ? new Date(a.latestBalance.createdAt).getTime() : 0;
          bVal = b.latestBalance?.createdAt ? new Date(b.latestBalance.createdAt).getTime() : 0;
          break;
        case 'interestRate':
          aVal = a.account.interestRate ? parseFloat(a.account.interestRate) : 0;
          bVal = b.account.interestRate ? parseFloat(b.account.interestRate) : 0;
          break;
        case 'fixedRateEnd':
          aVal = a.account.fixedBonusRateEndDate ? new Date(a.account.fixedBonusRateEndDate).getTime() : 0;
          bVal = b.account.fixedBonusRateEndDate ? new Date(b.account.fixedBonusRateEndDate).getTime() : 0;
          break;
        default:
          return 0;
      }

      return compareValues(aVal, bVal);
    });

    return sorted;
  });

  return {
    sortBy,
    sortDirection,
    setSortBy,
    sortedItems,
  };
}
