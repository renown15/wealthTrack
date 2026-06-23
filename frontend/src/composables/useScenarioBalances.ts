import { ref, type Ref } from 'vue';
import { apiService } from '@services/ApiService';
import { authState } from '@/modules/auth';
import { debug } from '@utils/debug';
import type { PortfolioItem } from '@models/WealthTrackDataModels';
import { getDisplayBalance } from '@views/AccountHub/accountDisplayUtils';

export function useScenarioBalances(): {
  balanceMap: Ref<Record<number, number>>;
  portfolioItemsById: Ref<Record<number, PortfolioItem>>;
  loadBalances: () => Promise<void>;
} {
  const balanceMap = ref<Record<number, number>>({});
  const portfolioItemsById = ref<Record<number, PortfolioItem>>({});

  function absorb(items: PortfolioItem[]): void {
    for (const item of items) {
      const display = getDisplayBalance(item);
      const val = display !== null && display !== undefined ? parseFloat(String(display)) : NaN;
      if (!isNaN(val)) balanceMap.value[item.account.id] = val;
      portfolioItemsById.value[item.account.id] = item;
    }
  }

  async function loadBalances(): Promise<void> {
    try {
      const [portfolio, families] = await Promise.all([apiService.getPortfolio(), apiService.getFamilies()]);
      absorb(portfolio.items);
      const currentUserId = authState.user?.id;
      await Promise.all(families.flatMap(family =>
        family.members
          .filter(m => m.accountId !== currentUserId)
          .map(async m => {
            try {
              const mp = await apiService.getFamilyMemberPortfolio(family.id, m.accountId);
              absorb(mp.items);
            } catch (err) { debug.error('[ScenarioBalances] member portfolio:', err); }
          }),
      ));
    } catch (err) { debug.error('[ScenarioBalances] portfolio:', err); }
  }

  return { balanceMap, portfolioItemsById, loadBalances };
}
