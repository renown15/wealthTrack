/**
 * Represents a security credential attached to an institution.
 */
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
