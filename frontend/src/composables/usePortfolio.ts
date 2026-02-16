/**
 * Portfolio composable - MVC Model/Controller layer for portfolio management
 */

import { computed, reactive } from 'vue';
import { apiService } from '@/services/ApiService';
import {
  calculateTotalValue,
  calculateCashAtHand,
  calculateIsaSavings,
  calculateIlliquid,
  calculateTrustAssets,
} from '@composables/portfolioCalculations';
import { createPortfolioCrudHandlers } from '@composables/portfolioCrudHandlers';
import type { PortfolioState, PortfolioComposableReturn } from '@composables/portfolioTypes';

export type { PortfolioState, PortfolioComposableReturn } from '@composables/portfolioTypes';

export function usePortfolio(): PortfolioComposableReturn {
  const state = reactive<PortfolioState>({
    items: [],
    institutions: [],
    loading: false,
    error: null,
  });

  const totalValue = computed(() => calculateTotalValue(state.items));
  const accountCount = computed(() => state.items.length);
  const institutionCount = computed(() => state.institutions.length);
  const eventCount = computed(() =>
    state.items.reduce((sum, item) => sum + (item.eventCount ?? 0), 0)
  );
  const cashAtHand = computed(() => calculateCashAtHand(state.items));
  const isaSavings = computed(() => calculateIsaSavings(state.items));
  const illiquid = computed(() => calculateIlliquid(state.items));
  const trustAssets = computed(() => calculateTrustAssets(state.items));

  const loadPortfolio = async (): Promise<void> => {
    try {
      state.loading = true;
      state.error = null;
      const [portfolioData, institutionsData] = await Promise.all([
        apiService.getPortfolio(),
        apiService.getInstitutions(),
      ]);
      state.items = portfolioData.items || [];
      state.institutions = institutionsData;
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to load portfolio';
    } finally {
      state.loading = false;
    }
  };

  const crudHandlers = createPortfolioCrudHandlers(state, loadPortfolio);

  return {
    state,
    totalValue,
    accountCount,
    institutionCount,
    eventCount,
    cashAtHand,
    isaSavings,
    illiquid,
    trustAssets,
    loadPortfolio,
    createAccount: crudHandlers.createAccount,
    updateAccount: crudHandlers.updateAccount,
    deleteAccount: crudHandlers.deleteAccount,
    createInstitution: crudHandlers.createInstitution,
    updateInstitution: crudHandlers.updateInstitution,
    deleteInstitution: crudHandlers.deleteInstitution,
    clearError: crudHandlers.clearError,
  };
}
