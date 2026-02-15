/**
 * Portfolio/Dashboard data models
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
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Institution {
  id: number;
  userId: number;
  name: string;
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
}

export interface InstitutionCreateRequest {
  name: string;
  parentId?: number | null;
}

export interface InstitutionUpdateRequest {
  name?: string;
  parentId?: number | null;
}

export interface AccountEventCreateRequest {
  event_type: string;
  value: string;
}
