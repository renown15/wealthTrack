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
  calculateProjectedAnnualYield,
} from '@composables/portfolioCalculations';
import { createPortfolioCrudHandlers } from '@composables/portfolioCrudHandlers';
import type { PortfolioState, PortfolioComposableReturn } from '@composables/portfolioTypes';

export type { PortfolioState, PortfolioComposableReturn } from '@composables/portfolioTypes';

export function usePortfolio(): PortfolioComposableReturn {
  const state = reactive<PortfolioState>({
    items: [],
    institutions: [],
    itemsLoading: false,
    institutionsLoading: false,
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
  const projectedAnnualYield = computed(() => calculateProjectedAnnualYield(state.items));
  const lastPriceUpdate = computed(() => (state as any).lastPriceUpdateValue ?? null);

  const loadPortfolio = async (): Promise<void> => {
    state.error = null;

    const itemsWork = (async (): Promise<void> => {
      state.itemsLoading = true;
      try {
        const portfolioData = await apiService.getPortfolio();
        state.items = portfolioData.items || [];
        (state as any).lastPriceUpdateValue = portfolioData.lastPriceUpdate || null;
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Failed to load portfolio';
      } finally {
        state.itemsLoading = false;
      }
    })();

    const institutionsWork = (async (): Promise<void> => {
      state.institutionsLoading = true;
      try {
        const institutionsData = await apiService.getInstitutions();
        state.institutions = institutionsData;
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Failed to load institutions';
      } finally {
        state.institutionsLoading = false;
      }
    })();

    await Promise.all([itemsWork, institutionsWork]);
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
    projectedAnnualYield,
    lastPriceUpdate,
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
