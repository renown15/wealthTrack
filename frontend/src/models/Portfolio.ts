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
}

export interface AccountUpdateRequest {
  name?: string;
  typeId?: number;
  statusId?: number;
}

export interface InstitutionCreateRequest {
  name: string;
}

export interface InstitutionUpdateRequest {
  name: string;
}
