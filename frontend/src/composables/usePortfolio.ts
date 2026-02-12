/**
 * Portfolio composable - MVC Model/Controller layer for portfolio management
 */

import { computed, reactive } from 'vue';
import { apiService } from '@/services/ApiService';
import type { PortfolioItem, Institution } from '@/models/WealthTrackDataModels';

export interface PortfolioState {
  items: PortfolioItem[];
  institutions: Institution[];
  loading: boolean;
  error: string | null;
}

export function usePortfolio(): {
  state: PortfolioState;
  totalValue: import('vue').ComputedRef<number>;
  accountCount: import('vue').ComputedRef<number>;
  loadPortfolio: () => Promise<void>;
  createAccount: (institutionid: number, name: string, typeId?: number, statusId?: number, accountNumber?: string, sortCode?: string, rollRefNumber?: string, interestRate?: string, fixedBonusRate?: string, fixedBonusRateEndDate?: string) => Promise<void>;
  updateAccount: (accountId: number, name: string, typeId?: number, statusId?: number, accountNumber?: string, sortCode?: string, rollRefNumber?: string, interestRate?: string, fixedBonusRate?: string, fixedBonusRateEndDate?: string) => Promise<void>;
  deleteAccount: (accountId: number) => Promise<void>;
  createInstitution: (name: string, parentId?: number | null) => Promise<void>;
  updateInstitution: (institutionId: number, name: string, parentId?: number | null) => Promise<void>;
  deleteInstitution: (institutionId: number) => Promise<void>;
  clearError: () => void;
} {
  const state = reactive<PortfolioState>({
    items: [],
    institutions: [],
    loading: false,
    error: null,
  });

  const totalValue = computed(() => {
    return state.items.reduce((sum, item) => {
      if (item.latestBalance?.value) {
        return sum + parseFloat(item.latestBalance.value);
      }
      return sum;
    }, 0);
  });

  const accountCount = computed(() => state.items.length);

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

  const createAccount = async (
    institutionId: number,
    name: string,
    typeId?: number,
    statusId?: number,
    accountNumber?: string,
    sortCode?: string,
    rollRefNumber?: string,
    interestRate?: string,
    fixedBonusRate?: string,
    fixedBonusRateEndDate?: string,
  ): Promise<void> => {
    try {
      state.error = null;
      await apiService.createAccount({
        institutionId,
        name,
        typeId,
        statusId,
        accountNumber,
        sortCode,
        rollRefNumber,
        interestRate,
        fixedBonusRate,
        fixedBonusRateEndDate,
      });
      await loadPortfolio();
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to create account';
      throw error;
    }
  };

  const updateAccount = async (accountId: number, name: string, typeId?: number, statusId?: number, accountNumber?: string, sortCode?: string, rollRefNumber?: string, interestRate?: string, fixedBonusRate?: string, fixedBonusRateEndDate?: string): Promise<void> => {
    try {
      state.error = null;
      await apiService.updateAccount(accountId, {
        name,
        typeId,
        statusId,
        accountNumber,
        sortCode,
        rollRefNumber,
        interestRate,
        fixedBonusRate,
        fixedBonusRateEndDate,
      });
      await loadPortfolio();
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to update account';
      throw error;
    }
  };

  const deleteAccount = async (accountId: number): Promise<void> => {
    try {
      state.error = null;
      await apiService.deleteAccount(accountId);
      await loadPortfolio();
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to delete account';
      throw error;
    }
  };

  const createInstitution = async (name: string, parentId: number | null = null): Promise<void> => {
    try {
      state.error = null;
      await apiService.createInstitution({ name, parentId });
      await loadPortfolio();
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to create institution';
      throw error;
    }
  };

  const updateInstitution = async (institutionId: number, name: string, parentId: number | null = null): Promise<void> => {
    try {
      state.error = null;
      await apiService.updateInstitution(institutionId, { name, parentId });
      await loadPortfolio();
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to update institution';
      throw error;
    }
  };

  const deleteInstitution = async (institutionId: number): Promise<void> => {
    try {
      state.error = null;
      await apiService.deleteInstitution(institutionId);
      await loadPortfolio();
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to delete institution';
      throw error;
    }
  };

  const clearError = (): void => {
    state.error = null;
  };

  return {
    state,
    totalValue,
    accountCount,
    loadPortfolio,
    createAccount,
    updateAccount,
    deleteAccount,
    createInstitution,
    updateInstitution,
    deleteInstitution,
    clearError,
  };
}
