/**
 * Form validation utilities for AddAccountModal
 */

export interface AccountFormData {
  name: string;
  institutionId: number;
  typeId?: number;
  statusId?: number;
  openedAt?: string | null;
  closedAt?: string | null;
  accountNumber?: string | null;
  sortCode?: string | null;
  rollRefNumber?: string | null;
  interestRate?: string | null;
  fixedBonusRate?: string | null;
  fixedBonusRateEndDate?: string | null;
  releaseDate?: string | null;
  numberOfShares?: string | null;
  underlying?: string | null;
  price?: string | null;
  purchasePrice?: string | null;
}

export interface InstitutionFormData {
  name: string;
  parentId?: number | null;
  institutionType?: string | null;
}

export function validateInstitutionForm(data: InstitutionFormData): string | null {
  if (!data.name) {
    return 'Please enter a name';
  }
  return null;
}

function isPositiveInteger(value: string): boolean {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0;
}

export function validatePenceField(value: string | null | undefined, label: string): string | null {
  if (!value) return null;
  if (!isPositiveInteger(value)) {
    return `${label} must be a whole positive number in pence (e.g., 1250 for £12.50)`;
  }
  return null;
}

export function validateAccountForm(
  data: AccountFormData,
  isCreate: boolean,
): string | null {
  if (!data.name) {
    return 'Please enter an account name';
  }
  if (isCreate && !data.institutionId) {
    return 'Please select an institution';
  }
  if (!data.typeId || !data.statusId) {
    return 'Please select an account type and status';
  }
  if (data.numberOfShares && !isPositiveInteger(data.numberOfShares)) {
    return 'Number of Shares must be a positive whole number';
  }
  return validatePenceField(data.price, 'Price') ?? validatePenceField(data.purchasePrice, 'Purchase Price');
}
