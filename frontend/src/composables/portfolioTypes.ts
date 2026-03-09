/**
 * Type definitions for portfolio composable
 */

import type { ComputedRef } from 'vue';
import type { PortfolioItem, Institution } from '@/models/WealthTrackDataModels';

export interface PortfolioState {
  items: PortfolioItem[];
  institutions: Institution[];
  itemsLoading: boolean;
  institutionsLoading: boolean;
  error: string | null;
}

export interface PortfolioComposableReturn {
  state: PortfolioState;
  totalValue: ComputedRef<number>;
  accountCount: ComputedRef<number>;
  institutionCount: ComputedRef<number>;
  eventCount: ComputedRef<number>;
  cashAtHand: ComputedRef<number>;
  isaSavings: ComputedRef<number>;
  illiquid: ComputedRef<number>;
  trustAssets: ComputedRef<number>;
  projectedAnnualYield: ComputedRef<number>;
  loadPortfolio: () => Promise<void>;
  createAccount: (
    institutionId: number,
    name: string,
    typeId: number,
    statusId: number,
    accountNumber?: string,
    sortCode?: string,
    rollRefNumber?: string,
    interestRate?: string,
    fixedBonusRate?: string,
    fixedBonusRateEndDate?: string,
    releaseDate?: string,
    numberOfShares?: string,
    underlying?: string,
    price?: string,
    purchasePrice?: string,
    pensionMonthlyPayment?: string,
    assetClass?: string,
  ) => Promise<void>;
  updateAccount: (
    accountId: number,
    name: string,
    typeId?: number,
    statusId?: number,
    accountNumber?: string,
    sortCode?: string,
    rollRefNumber?: string,
    interestRate?: string,
    fixedBonusRate?: string,
    fixedBonusRateEndDate?: string,
    releaseDate?: string,
    numberOfShares?: string,
    underlying?: string,
    price?: string,
    purchasePrice?: string,
    pensionMonthlyPayment?: string,
    assetClass?: string,
  ) => Promise<void>;
  deleteAccount: (accountId: number) => Promise<void>;
  createInstitution: (
    name: string,
    parentId?: number | null,
    institutionType?: string | null,
  ) => Promise<void>;
  updateInstitution: (
    institutionId: number,
    name: string,
    parentId?: number | null,
    institutionType?: string | null,
  ) => Promise<void>;
  deleteInstitution: (institutionId: number) => Promise<void>;
  clearError: () => void;
}
