/** WealthTrack core data models */
import type { components } from '@/types/api.gen';
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
  encumbrance?: string | null;
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
  key?: string | null;
  value?: string | null;
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
  paymentDate?: string | null;
  grossBalance?: string | null;
  encumbrance?: string | null;
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
  docCount?: number;
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

export interface Portfolio { items: PortfolioItem[]; totalValue: number; accountCount: number; lastPriceUpdate?: string | null; groups?: AccountGroup[]; groupMembers?: Record<number, number[]>; }

// Request types — sourced from the generated API spec (frontend/src/types/api.gen.ts).
// Run 'make generate-api-types' after changing backend schemas, then 'make pr-check'.
export type AccountCreateRequest = components['schemas']['AccountCreate'];
export type AccountUpdateRequest = components['schemas']['AccountUpdate'];
export type InstitutionCreateRequest = components['schemas']['InstitutionCreate'];
export type InstitutionUpdateRequest = components['schemas']['InstitutionUpdate'];
export type AccountEventCreateRequest = components['schemas']['AccountEventCreate'];
export type AccountGroupCreateRequest = components['schemas']['AccountGroupCreate'];
export type AccountGroupUpdateRequest = components['schemas']['AccountGroupUpdate'];

export interface AccountDetail {
  accountId: number;
  accountName: string;
  institutionName: string;
  balance: number;
  isClosed?: boolean;
}

export interface BreakdownItem {
  label: string;
  value: number;
  accounts: AccountDetail[];
}

export interface AccountDocument {
  id: number;
  accountId: number;
  filename: string;
  description: string | null;
  contentType: string | null;
  createdAt: string;
}

export interface PortfolioBreakdown {
  byType: BreakdownItem[];
  byInstitution: BreakdownItem[];
  byAssetClass: BreakdownItem[];
  byAssetClassNoPension: BreakdownItem[];
  total: number;
}

export interface HistoryPoint {
  date: string;
  totalValue: number;
}

export interface PortfolioHistory {
  baselineDate: string | null;
  history: HistoryPoint[];
}
