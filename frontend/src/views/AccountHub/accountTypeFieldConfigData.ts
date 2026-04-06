/**
 * Account type field configuration data
 */

import type { FieldConfig } from '@views/AccountHub/accountTypeFieldConfigTypes';

const baseConfig: FieldConfig = {
  showInterestRate: false,
  showFixedBonusRate: false,
  showFixedBonusRateEndDate: false,
  isDeferredType: false,
  showNumberOfShares: false,
  showUnderlying: false,
  showPrice: false,
  showPurchasePrice: false,
  showPensionMonthlyPayment: false,
  showAssetClass: true,
  showEncumbrance: false,
  showBankingDetails: false,
};

const withInterest: Partial<FieldConfig> = { showInterestRate: true };
const deferred: Partial<FieldConfig> = { isDeferredType: true };
const banking: Partial<FieldConfig> = { showBankingDetails: true };
const encumbrance: Partial<FieldConfig> = { showEncumbrance: true };
const assetClass: Partial<FieldConfig> = { showAssetClass: true };
const shares: Partial<FieldConfig> = { showNumberOfShares: true, showUnderlying: true, showPrice: true };

export const ACCOUNT_TYPE_FIELD_CONFIG: Record<string, FieldConfig> = {
  'Current Account':               { ...baseConfig, ...withInterest, ...banking, ...encumbrance },
  'Savings Account':               { ...baseConfig, ...withInterest, ...banking, ...encumbrance },
  'Premium Bonds':                 { ...baseConfig },
  'Fixed / Bonus Rate Saver':      { ...baseConfig, ...withInterest, showFixedBonusRate: true, showFixedBonusRateEndDate: true, ...banking },
  'Fixed Rate ISA':                { ...baseConfig, ...withInterest, showFixedBonusRateEndDate: true, ...banking },
  'Cash ISA':                      { ...baseConfig, ...withInterest, ...banking },
  'Stocks ISA':                    { ...baseConfig, ...assetClass },
  'ISA':                           { ...baseConfig, ...withInterest, ...banking },
  'Deferred DC Pension':           { ...baseConfig, ...deferred, ...assetClass },
  'Deferred DB Pension':           { ...baseConfig, ...deferred, showPensionMonthlyPayment: true },
  'Deferred Cash':                 { ...baseConfig, ...deferred },
  'Deferred Shares':               { ...baseConfig, ...deferred, ...shares, showPurchasePrice: true, ...assetClass },
  'RSU':                           { ...baseConfig, ...deferred, ...shares, ...assetClass },
  'Shares':                        { ...baseConfig, ...shares, showPurchasePrice: true, ...assetClass },
  'Trust Bank Account':            { ...baseConfig, ...withInterest, ...banking },
  'Trust Stocks Investment Account': { ...baseConfig, ...assetClass },
  'DEFAULT':                       { ...baseConfig, ...withInterest, ...banking },
};
