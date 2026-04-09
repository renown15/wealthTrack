/**
 * TypeScript models for the Tax Hub feature.
 */

export interface TaxPeriod {
  id: number;
  userId: number;
  name: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  createdAt: string;
  updatedAt: string;
}

export interface TaxPeriodCreateRequest {
  name: string;
  startDate: string;
  endDate: string;
}

export interface TaxReturn {
  id: number;
  accountId: number;
  taxPeriodId: number;
  income: number | null;
  capitalGain: number | null;
  taxTakenOff: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaxReturnUpsertRequest {
  income: number | null;
  capitalGain: number | null;
  taxTakenOff: number | null;
}

export interface TaxDocument {
  id: number;
  taxReturnId: number;
  filename: string;
  contentType: string | null;
  createdAt: string;
}

export interface EligibleAccount {
  accountId: number;
  accountName: string;
  accountType: string;
  institutionName: string | null;
  interestRate: string | null;
  accountStatus: string | null;
  accountNumber: string | null;
  sortCode: string | null;
  rollRefNumber: string | null;
  eligibilityReason: 'interest_bearing' | 'sold_in_period';
  eventCount: number;
  taxReturn: TaxReturn | null;
  documents: TaxDocument[];
}
