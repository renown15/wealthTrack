import type { ReferenceDataItem } from '@/models/ReferenceData';
import type { Institution } from '@/models/WealthTrackDataModels';

/**
 * Convert DD/MM/YYYY to YYYY-MM-DD for HTML date input
 */
export function convertToDateInputFormat(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return dateStr;
}

/**
 * Convert YYYY-MM-DD to DD/MM/YYYY for API submission
 */
export function convertFromDateInputFormat(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export interface AccountFormData {
  name: string;
  institutionId: number;
  typeId: number;
  statusId: number;
  openedAt: string;
  closedAt: string;
  accountNumber: string;
  sortCode: string;
  rollRefNumber: string;
  interestRate: string;
  fixedBonusRate: string;
  fixedBonusRateEndDate: string;
  releaseDate: string;
  numberOfShares: string;
  underlying: string;
  price: string;
  purchasePrice: string;
  pensionMonthlyPayment: string;
  assetClass: string;
  encumbrance: string;
  taxYear: string;
}

export interface AccountFormProps {
  open: boolean;
  resourceType: 'account' | 'institution';
  type?: 'create' | 'edit';
  initialName?: string;
  initialInstitutionId?: number;
  initialTypeId?: number;
  initialStatusId?: number;
  initialOpenedAt?: string | null;
  initialClosedAt?: string | null;
  initialAccountNumber?: string | null;
  initialSortCode?: string | null;
  initialRollRefNumber?: string | null;
  initialInterestRate?: string | null;
  initialFixedBonusRate?: string | null;
  initialFixedBonusRateEndDate?: string | null;
  initialReleaseDate?: string | null;
  initialNumberOfShares?: string | null;
  initialUnderlying?: string | null;
  initialPrice?: string | null;
  initialPurchasePrice?: string | null;
  initialPensionMonthlyPayment?: string | null;
  initialAssetClass?: string | null;
  initialEncumbrance?: string | null;
  initialTaxYear?: string | null;
  accountTypes: ReferenceDataItem[];
  accountStatuses: ReferenceDataItem[];
  institutions?: Institution[];
}
