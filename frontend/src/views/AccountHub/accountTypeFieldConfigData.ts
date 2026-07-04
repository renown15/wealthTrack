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
  showPolicyNumber: false,
  showTaxYear: false,
  showReleaseDate: false,
  showRenewalDate: false,
  showRenewalType: false,
  showMonthlyCost: false,
};

const withInterest: Partial<FieldConfig> = { showInterestRate: true };
// Deferred asset types: hide Opened Date/balance, but do show a Release Date.
const deferred: Partial<FieldConfig> = { isDeferredType: true, showReleaseDate: true };
const banking: Partial<FieldConfig> = { showBankingDetails: true };
const encumbrance: Partial<FieldConfig> = { showEncumbrance: true };
const assetClass: Partial<FieldConfig> = { showAssetClass: true };
const shares: Partial<FieldConfig> = { showNumberOfShares: true, showUnderlying: true, showPrice: true };
// Outgoings: reuse isDeferredType to hide Opened Date/balance, but no Release Date;
// they get a Renewal Type + optional Renewal Date + Cost instead.
const outgoing: Partial<FieldConfig> = { isDeferredType: true, showRenewalType: true, showRenewalDate: true, showMonthlyCost: true, showPolicyNumber: true, showAssetClass: false };

export const ACCOUNT_TYPE_ASSET_GROUP: Record<string, string> = {
  'Current Account':                'cash',
  'Savings Account':                'cash',
  'Premium Bonds':                  'cash',
  'Fixed / Bonus Rate Saver':       'cash',
  'Fixed Rate ISA':                 'cash',
  'Cash ISA':                       'cash',
  'ISA':                            'cash',
  'Trust Bank Account':             'cash',
  'Stocks ISA':                     'equity',
  'Trust Stocks Investment Account': 'equity',
  'Shares':                         'shares',
  'Deferred Shares':                'shares',
  'RSU':                            'shares',
  'Deferred DC Pension':            'pension',
  'Deferred DB Pension':            'pension',
  'Deferred Cash':                  'deferred-cash',
  'Tax Liability':                  'tax-liability',
  'Utility - Gas':                  'outgoing',
  'Utility - Electric':             'outgoing',
  'Utility - Water':                'outgoing',
  'Utility - Broadband':            'outgoing',
  'Insurance - Home':               'outgoing',
  'Insurance - Car':                'outgoing',
  'Insurance - Life':               'outgoing',
  'Insurance - Health':             'outgoing',
  'Insurance - Income Protection':  'outgoing',
  'Subscription':                   'outgoing',
  'Household':                      'outgoing',
  'Membership':                     'outgoing',
};

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
  'Tax Liability':                 { ...baseConfig, showAssetClass: false, showTaxYear: true },
  'Utility - Gas':                 { ...baseConfig, ...outgoing },
  'Utility - Electric':            { ...baseConfig, ...outgoing },
  'Utility - Water':               { ...baseConfig, ...outgoing },
  'Utility - Broadband':           { ...baseConfig, ...outgoing },
  'Insurance - Home':              { ...baseConfig, ...outgoing },
  'Insurance - Car':               { ...baseConfig, ...outgoing },
  'Insurance - Life':              { ...baseConfig, ...outgoing },
  'Insurance - Health':            { ...baseConfig, ...outgoing },
  'Insurance - Income Protection': { ...baseConfig, ...outgoing },
  'Subscription':                  { ...baseConfig, ...outgoing },
  'Household':                     { ...baseConfig, ...outgoing },
  'Membership':                    { ...baseConfig, ...outgoing },
  'DEFAULT':                       { ...baseConfig, ...withInterest, ...banking },
};
