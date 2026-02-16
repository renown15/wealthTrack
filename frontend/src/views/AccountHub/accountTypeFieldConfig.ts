/**
 * Account form field configuration by account type
 */

export interface FieldConfig {
  showInterestRate: boolean;
  showFixedBonusRate: boolean;
  showFixedBonusRateEndDate: boolean;
  isDeferredType: boolean;
  showNumberOfShares: boolean;
  showUnderlying: boolean;
  showPrice: boolean;
  showPurchasePrice: boolean;
}

export const ACCOUNT_TYPE_FIELD_CONFIG: Record<string, FieldConfig> = {
  'Current Account': {
    showInterestRate: true,
    showFixedBonusRate: false,
    showFixedBonusRateEndDate: false,
    isDeferredType: false,
    showNumberOfShares: false,
    showUnderlying: false,
    showPrice: false,
    showPurchasePrice: false,
  },
  'Savings Account': {
    showInterestRate: true,
    showFixedBonusRate: false,
    showFixedBonusRateEndDate: false,
    isDeferredType: false,
    showNumberOfShares: false,
    showUnderlying: false,
    showPrice: false,
    showPurchasePrice: false,
  },
  'Premium Bonds': {
    showInterestRate: false,
    showFixedBonusRate: false,
    showFixedBonusRateEndDate: false,
    isDeferredType: false,
    showNumberOfShares: false,
    showUnderlying: false,
    showPrice: false,
    showPurchasePrice: false,
  },
  'Fixed / Bonus Rate Saver': {
    showInterestRate: true,
    showFixedBonusRate: true,
    showFixedBonusRateEndDate: true,
    isDeferredType: false,
    showNumberOfShares: false,
    showUnderlying: false,
    showPrice: false,
    showPurchasePrice: false,
  },
  'Fixed Rate ISA': {
    showInterestRate: true,
    showFixedBonusRate: false,
    showFixedBonusRateEndDate: true,
    isDeferredType: false,
    showNumberOfShares: false,
    showUnderlying: false,
    showPrice: false,
    showPurchasePrice: false,
  },
  'Cash ISA': {
    showInterestRate: true,
    showFixedBonusRate: false,
    showFixedBonusRateEndDate: false,
    isDeferredType: false,
    showNumberOfShares: false,
    showUnderlying: false,
    showPrice: false,
    showPurchasePrice: false,
  },
  'Stocks ISA': {
    showInterestRate: false,
    showFixedBonusRate: false,
    showFixedBonusRateEndDate: false,
    isDeferredType: false,
    showNumberOfShares: false,
    showUnderlying: false,
    showPrice: false,
    showPurchasePrice: false,
  },
  'ISA': {
    showInterestRate: true,
    showFixedBonusRate: false,
    showFixedBonusRateEndDate: false,
    isDeferredType: false,
    showNumberOfShares: false,
    showUnderlying: false,
    showPrice: false,
    showPurchasePrice: false,
  },
  'Deferred Cash': {
    showInterestRate: false,
    showFixedBonusRate: false,
    showFixedBonusRateEndDate: false,
    isDeferredType: true,
    showNumberOfShares: false,
    showUnderlying: false,
    showPrice: false,
    showPurchasePrice: false,
  },
  'Deferred Shares': {
    showInterestRate: false,
    showFixedBonusRate: false,
    showFixedBonusRateEndDate: false,
    isDeferredType: true,
    showNumberOfShares: true,
    showUnderlying: true,
    showPrice: true,
    showPurchasePrice: true,
  },
  'RSU': {
    showInterestRate: false,
    showFixedBonusRate: false,
    showFixedBonusRateEndDate: false,
    isDeferredType: true,
    showNumberOfShares: true,
    showUnderlying: true,
    showPrice: true,
    showPurchasePrice: false,
  },
  'Trust Bank Account': {
    showInterestRate: true,
    showFixedBonusRate: false,
    showFixedBonusRateEndDate: false,
    isDeferredType: false,
    showNumberOfShares: false,
    showUnderlying: false,
    showPrice: false,
    showPurchasePrice: false,
  },
  'Trust Stocks Investment Account': {
    showInterestRate: false,
    showFixedBonusRate: false,
    showFixedBonusRateEndDate: false,
    isDeferredType: false,
    showNumberOfShares: false,
    showUnderlying: false,
    showPrice: false,
    showPurchasePrice: false,
  },
  'DEFAULT': {
    showInterestRate: true,
    showFixedBonusRate: false,
    showFixedBonusRateEndDate: false,
    isDeferredType: false,
    showNumberOfShares: false,
    showUnderlying: false,
    showPrice: false,
    showPurchasePrice: false,
  },
};
