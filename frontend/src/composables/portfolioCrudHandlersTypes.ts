/**
 * Type definitions for portfolio CRUD handlers
 */

export interface PortfolioCrudHandlers {
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
