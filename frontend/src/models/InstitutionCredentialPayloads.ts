export interface InstitutionSecurityCredentialCreate {
  typeId: number;
  value: string;
}

export interface InstitutionSecurityCredentialUpdate {
  typeId?: number;
  value?: string;
}
