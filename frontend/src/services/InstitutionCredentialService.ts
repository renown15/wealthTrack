import type { InstitutionCredential, InstitutionCredentialCreate, InstitutionCredentialUpdate } from '@/models/WealthTrackDataModels';
import { BaseApiClient } from '@services/BaseApiClient';

class InstitutionCredentialService extends BaseApiClient {
  async list(institutionId: number): Promise<InstitutionCredential[]> {
    const response = await this.retryRequest(() =>
      this.client.get<InstitutionCredential[]>(`/api/v1/institutions/${institutionId}/credentials`),
    );
    return response.data;
  }

  async create(
    institutionId: number,
    payload: InstitutionCredentialCreate,
  ): Promise<InstitutionCredential> {
    const response = await this.retryRequest(() =>
      this.client.post<InstitutionCredential>(
        `/api/v1/institutions/${institutionId}/credentials`,
        payload,
      ),
    );
    return response.data;
  }

  async update(
    institutionId: number,
    credentialId: number,
    payload: InstitutionCredentialUpdate,
  ): Promise<InstitutionCredential> {
    const response = await this.retryRequest(() =>
      this.client.put<InstitutionCredential>(
        `/api/v1/institutions/${institutionId}/credentials/${credentialId}`,
        payload,
      ),
    );
    return response.data;
  }

  async delete(institutionId: number, credentialId: number): Promise<void> {
    await this.retryRequest(() =>
      this.client.delete(`/api/v1/institutions/${institutionId}/credentials/${credentialId}`),
    );
  }
}

export const institutionCredentialService = new InstitutionCredentialService();