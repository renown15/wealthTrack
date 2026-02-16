/**
 * Deferred Accounts Balance Calculation Utility
 * 
 * Unified access to deferred shares, cash, and RSU calculations.
 * Individual calculation functions are in separate modules.
 */

// Export types and functions for backward compatibility
export type { DeferredSharesCalculation } from '@utils/deferredShares';
export {
  calculateDeferredSharesBalance,
  calculateDeferredSharesBalanceDetailed,
  calculateDeferredSharesBalanceDetailedSafe,
  calculateDeferredSharesBalanceSafe,
} from '@utils/deferredShares';

export type { DeferredCashCalculation } from '@utils/deferredCash';
export {
  calculateDeferredCashBalance,
  calculateDeferredCashBalanceDetailed,
  calculateDeferredCashBalanceDetailedSafe,
  calculateDeferredCashBalanceSafe,
} from '@utils/deferredCash';

export type { RSUCalculation } from '@utils/rsu';
export {
  calculateRSUBalance,
  calculateRSUBalanceDetailed,
  calculateRSUBalanceDetailedSafe,
  calculateRSUBalanceSafe,
} from '@utils/rsu';
