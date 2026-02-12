/**
 * Reference data lookup values that power select dropdowns.
 */
export interface ReferenceDataItem {
  id: number;
  classKey: string;
  referenceValue: string;
  sortIndex: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Payload for creating or updating reference data.
 */
export interface ReferenceDataPayload {
  classKey: string;
  referenceValue: string;
  sortIndex?: number;
}