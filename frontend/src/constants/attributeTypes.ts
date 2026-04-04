/**
 * Frontend mirror of backend AttributeType / EventType enums.
 * Keeps value_type metadata in sync with backend/app/types/attribute_types.py
 */

export type AttributeValueType =
  | 'string'
  | 'sort_code'
  | 'percentage'
  | 'number'
  | 'date'
  | 'asset_class_ref';

export interface AttributeTypeMeta {
  label: string;
  valueType: AttributeValueType;
}

export const ATTRIBUTE_TYPES: Record<string, AttributeTypeMeta> = {
  account_number:           { label: 'Account Number',           valueType: 'string' },
  sort_code:                { label: 'Sort Code',                valueType: 'sort_code' },
  roll_ref_number:          { label: 'Roll / Ref Number',        valueType: 'string' },
  interest_rate:            { label: 'Interest Rate',            valueType: 'percentage' },
  fixed_bonus_rate:         { label: 'Fixed Bonus Rate',         valueType: 'percentage' },
  fixed_bonus_rate_end_date:{ label: 'Fixed Bonus Rate End Date',valueType: 'date' },
  release_date:             { label: 'Release Date',             valueType: 'date' },
  number_of_shares:         { label: 'Number of Shares',         valueType: 'number' },
  underlying:               { label: 'Underlying',               valueType: 'string' },
  price:                    { label: 'Price',                    valueType: 'number' },
  purchase_price:           { label: 'Purchase Price',           valueType: 'number' },
  pension_monthly_payment:  { label: 'Pension Monthly Payment',  valueType: 'number' },
  asset_class:              { label: 'Asset Class',              valueType: 'asset_class_ref' },
  encumbrance:              { label: 'Encumbrance',              valueType: 'number' },
  unencumbered_balance:     { label: 'Unencumbered Balance',     valueType: 'number' },
};

export const SORT_CODE_REGEX = /^\d{2}-\d{2}-\d{2}$/;

/** Validate a field value; returns error message string or null if valid. */
export function validateAttributeField(field: string, value: string | null | undefined): string | null {
  if (!value) return null;
  const meta = ATTRIBUTE_TYPES[field];
  if (!meta) return null;
  if (meta.valueType === 'sort_code') {
    return SORT_CODE_REGEX.test(value) ? null : 'Sort code must be in XX-YY-ZZ format';
  }
  if (meta.valueType === 'percentage') {
    const n = parseFloat(value);
    if (isNaN(n)) return 'Must be a number';
    if (n < 0 || n > 100) return 'Must be between 0 and 100';
  }
  if (meta.valueType === 'number') {
    if (isNaN(parseFloat(value))) return 'Must be a number';
  }
  return null;
}
