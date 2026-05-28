export interface RecordGiftRequest {
  donor: string;
  giftDate: string;
  giftValueGbp: string;
  numShares?: string | null;
}

export interface RecordGiftResponse {
  groupId: number;
  accountId: number;
  donor: string;
  giftDate: string;
  giftValueGbp: string;
  numShares?: string | null;
}

export interface GiftSummary {
  groupId: number;
  accountId: number;
  accountName: string;
  donor: string;
  giftDate: string;
  giftValueGbp: string;
  numShares?: string | null;
  yearsElapsed: number;
  ihtRate: string;
  ihtExposure: string;
}
