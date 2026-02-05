/**
 * Portfolio/Dashboard data models
 */

export interface Account {
  id: number;
  userid: number;
  institutionid: number;
  name: string;
  typeid: number;
  statusid: number;
  created_at: string;
  updated_at: string;
}

export interface Institution {
  id: number;
  userid: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AccountEvent {
  id: number;
  accountid: number;
  userid: number;
  eventtype: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItem {
  account: Account;
  institution: Institution | null;
  latest_balance: AccountEvent | null;
}

export interface Portfolio {
  items: PortfolioItem[];
  totalValue: number;
  accountCount: number;
}

export interface AccountCreateRequest {
  institutionid: number;
  name: string;
  typeid?: number;
  statusid?: number;
}

export interface AccountUpdateRequest {
  name?: string;
  typeid?: number;
  statusid?: number;
}

export interface InstitutionCreateRequest {
  name: string;
}

export interface InstitutionUpdateRequest {
  name: string;
}
