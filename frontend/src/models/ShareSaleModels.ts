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
  cgt: string;
  remainingShares?: string | null;
  cashNewBalance: string;
  taxLiabilityNewBalance: string;
}
