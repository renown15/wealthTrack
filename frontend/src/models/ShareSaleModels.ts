/** ShareSale-related data models */

export interface ShareSaleRequest {
  sharesAccountId: number;
  cashAccountId: number;
  taxLiabilityAccountId: number;
  sharesSold: string;
  salePricePerShare: string;
}

export interface ShareSaleResponse {
  sharesSold: string;
  salePricePerShare: string;
  proceeds: string;
  purchasePricePerShare: string;
  capitalGain: string;
  cgtRate: string;
  cgt: string;
  remainingShares?: string | null;
  cashNewBalance: string;
  taxLiabilityNewBalance: string;
}

export interface ShareSaleSummaryEvent {
  id: number;
  accountId: number;
  eventType: string;
  value: string | null;
  createdAt: string;
}

export interface ShareSaleSummaryAttribute {
  id: number;
  accountId: number;
  attributeType: string;
  value: string | null;
}

export interface ShareSaleSummary {
  groupId: number;
  soldAt: string;
  events: ShareSaleSummaryEvent[];
  attributes: ShareSaleSummaryAttribute[];
  // Derived fields populated server-side
  sharesSold?: string | null;
  proceeds?: string | null;
  cgt?: string | null;
  cashNewBalance?: string | null;
  taxNewBalance?: string | null;
  remainingShares?: string | null;
  salePricePence?: string | null;
  purchasePricePence?: string | null;
  capitalGain?: string | null;
  cgtRate?: string | null;
}
