/**
 * TypeScript models for the Tax Hub feature.
 * Types sourced from generated API spec — run 'make generate-api-types' after backend schema changes.
 */
import type { components } from '@/types/api.gen';

export type TaxPeriod = components['schemas']['TaxPeriodResponse'];
export type TaxPeriodCreateRequest = components['schemas']['TaxPeriodCreate'];
export type TaxReturn = components['schemas']['TaxReturnResponse'];
export type TaxReturnUpsertRequest = components['schemas']['TaxReturnUpsert'];
export type TaxDocument = components['schemas']['TaxDocumentResponse'];
export type TaxPeriodAccountsResponse = components['schemas']['TaxPeriodAccountsResponse'];
export type TaxScopeUpdateRequest = components['schemas']['TaxScopeUpdate'];

// EligibleAccount — keeps the specific eligibilityReason union type for template safety.
// The generated type uses 'string'; override here preserves exhaustive checks.
export type EligibleAccount = Omit<components['schemas']['EligibleAccountResponse'], 'eligibilityReason'> & {
  eligibilityReason: 'interest_bearing' | 'sold_in_period' | 'dividend_income' | 'in_scope' | 'tax_liability' | 'tax_free' | 'not_in_scope';
};
