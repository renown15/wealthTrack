/**
 * WealthTrack core data models
 * Defines all types for accounts, institutions, credentials, and portfolio data
 */

export interface Account {
  id: number;
  userId: number;
  institutionId: number;
  name: string;
  typeId: number;
  statusId: number;
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
  pensionMonthlyPayment?: string | null;
  assetClass?: string | null;
  targetPrice?: string | null;
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Institution {
  id: number;
  userId: number;
  name: string;
  parentId?: number | null;
  institutionType?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionCredential {
  id: number;
  institutionId: number;
  typeId: number;
  typeLabel: string;
  key?: string;
  value?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionCredentialCreate {
  typeId: number;
  key: string;
  value: string;
}

export interface InstitutionCredentialUpdate {
  typeId?: number;
  key?: string;
  value?: string;
}

export interface AccountEvent {
  id: number;
  accountId: number;
  userId: number;
  eventType: string;
  value: string;
  createdAt: string;
  updatedAt: string;
  source?: 'event' | 'attribute';
}

export interface PortfolioItem {
  account: Account;
  institution: Institution | null;
  latestBalance: AccountEvent | null;
  accountType?: string;
  eventCount?: number;
}

export interface AccountGroup {
  id: number;
  userId: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountGroupMember {
  id: number;
  accountGroupId: number;
  accountId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Portfolio {
  items: PortfolioItem[];
  totalValue: number;
  accountCount: number;
}

export interface AccountCreateRequest {
  institutionId: number;
  name: string;
  typeId?: number;
  statusId?: number;
  accountNumber?: string;
  sortCode?: string;
  rollRefNumber?: string;
  interestRate?: string;
  fixedBonusRate?: string;
  fixedBonusRateEndDate?: string;
  releaseDate?: string;
  numberOfShares?: string;
  underlying?: string;
  price?: string;
  purchasePrice?: string;
  pensionMonthlyPayment?: string;
  assetClass?: string;
}

export interface AccountUpdateRequest {
  name?: string;
  typeId?: number;
  statusId?: number;
  accountNumber?: string;
  sortCode?: string;
  rollRefNumber?: string;
  interestRate?: string;
  fixedBonusRate?: string;
  fixedBonusRateEndDate?: string;
  releaseDate?: string;
  numberOfShares?: string;
  underlying?: string;
  price?: string;
  purchasePrice?: string;
  pensionMonthlyPayment?: string;
  assetClass?: string;
}

export interface InstitutionCreateRequest {
  name: string;
  parentId?: number | null;
  institutionType?: string | null;
}

export interface InstitutionUpdateRequest {
  name?: string;
  parentId?: number | null;
  institutionType?: string | null;
}

export interface AccountEventCreateRequest {
  event_type: string;
  value: string;
}

export interface AccountGroupCreateRequest {
  name: string;
}

export interface AccountGroupUpdateRequest {
  name: string;
}

// Analytics types
export interface BreakdownItem {
  label: string;
  value: number;
}

export interface PortfolioBreakdown {
  byType: BreakdownItem[];
  byInstitution: BreakdownItem[];
  byAssetClass: BreakdownItem[];
  total: number;
}

export interface HistoryPoint {
  date: string;       // "YYYY-MM-DD"
  totalValue: number;
}

export interface PortfolioHistory {
  baselineDate: string | null;  // "YYYY-MM-DD" or null if not set
  history: HistoryPoint[];
}
