/**
 * Portfolio CRUD handlers - account and institution operations
 */

import type { PortfolioState } from '@composables/portfolioTypes';
import type { PortfolioCrudHandlers } from '@composables/portfolioCrudHandlersTypes';
import {
  createAccountOp,
  updateAccountOp,
  deleteAccountOp,
  createInstitutionOp,
  updateInstitutionOp,
  deleteInstitutionOp,
  type AccountCreatePayload,
  type AccountUpdatePayload,
} from '@composables/portfolioOperations';

export type { PortfolioCrudHandlers } from '@composables/portfolioCrudHandlersTypes';

export function createPortfolioCrudHandlers(
  state: PortfolioState,
  loadPortfolio: () => Promise<void>,
): PortfolioCrudHandlers {
  const createAccount = async (
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
    encumbrance?: string,
    taxYear?: string,
  ): Promise<void> => {
    state.error = null;
    const payload: AccountCreatePayload = {
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
      releaseDate,
      numberOfShares,
      underlying,
      price,
      purchasePrice,
      pensionMonthlyPayment,
      assetClass,
      encumbrance,
      taxYear,
    };
    await createAccountOp(payload);
    await loadPortfolio();
  };

  const updateAccount = async (
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
    encumbrance?: string,
    taxYear?: string,
  ): Promise<void> => {
    state.error = null;
    const payload: AccountUpdatePayload = {
      name,
      typeId,
      statusId,
      accountNumber,
      sortCode,
      rollRefNumber,
      interestRate,
      fixedBonusRate,
      fixedBonusRateEndDate,
      releaseDate,
      numberOfShares,
      underlying,
      price,
      purchasePrice,
      pensionMonthlyPayment,
      assetClass,
      encumbrance,
      taxYear,
    };
    await updateAccountOp(accountId, payload);
    await loadPortfolio();
  };

  const deleteAccount = async (accountId: number): Promise<void> => {
    state.error = null;
    await deleteAccountOp(accountId);
    await loadPortfolio();
  };

  const createInstitution = async (
    name: string,
    parentId: number | null = null,
    institutionType: string | null = null,
  ): Promise<void> => {
    state.error = null;
    await createInstitutionOp(name, parentId, institutionType);
    await loadPortfolio();
  };

  const updateInstitution = async (
    institutionId: number,
    name: string,
    parentId: number | null = null,
    institutionType: string | null = null,
  ): Promise<void> => {
    state.error = null;
    await updateInstitutionOp(institutionId, name, parentId, institutionType);
    await loadPortfolio();
  };

  const deleteInstitution = async (institutionId: number): Promise<void> => {
    state.error = null;
    await deleteInstitutionOp(institutionId);
    await loadPortfolio();
  };

  const clearError = (): void => {
    state.error = null;
  };

  return {
    createAccount,
    updateAccount,
    deleteAccount,
    createInstitution,
    updateInstitution,
    deleteInstitution,
    clearError,
  };
}
