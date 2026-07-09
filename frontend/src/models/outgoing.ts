/** Types for outgoing actual costs and provision projections */

export interface ActualCostItem {
  groupId: number;
  accountId: number;
  amount: string;
  costDate: string;
}

export interface ActualCostCreateRequest {
  amount: string;
  cost_date: string;
}

export interface OutgoingProjection {
  accountId: number;
  projectedCost: string;
  actualsCount: number;
}
