/**
 * Shared form type definitions for AccountFormFields
 */

import type { Institution } from '@/models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';

export interface FormData {
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

export interface AccountFormFieldsProps {
  formData: FormData;
  type: 'create' | 'edit';
  institutions: Institution[];
  accountTypes: ReferenceDataItem[];
  accountStatuses: ReferenceDataItem[];
}
