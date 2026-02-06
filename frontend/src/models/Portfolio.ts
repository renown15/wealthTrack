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
