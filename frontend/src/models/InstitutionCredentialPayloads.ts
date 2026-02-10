export interface InstitutionSecurityCredentialCreate {
  typeId: number;
  key: string;
  value: string;
}

export interface InstitutionSecurityCredentialUpdate {
  typeId?: number;
  key?: string;
  value?: string;
}
