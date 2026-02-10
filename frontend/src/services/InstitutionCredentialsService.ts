import type { InstitutionCredential } from '@/models/InstitutionCredential';
import type {
  InstitutionSecurityCredentialCreate,
  InstitutionSecurityCredentialUpdate,
} from '@/models/InstitutionCredentialPayloads';
import { BaseApiClient } from '@services/BaseApiClient';

class InstitutionCredentialsService extends BaseApiClient {
  async listCredentials(institutionId: number): Promise<InstitutionCredential[]> {
    const response = await this.retryRequest(() =>
      this.client.get<InstitutionCredential[]>(
        `/api/v1/institutions/${institutionId}/credentials`,
      ),
    );
    return response.data;
  }

  async createCredential(
    institutionId: number,
    payload: InstitutionSecurityCredentialCreate,
  ): Promise<InstitutionCredential> {
    const response = await this.retryRequest(() =>
      this.client.post<InstitutionCredential>(
        `/api/v1/institutions/${institutionId}/credentials`,
        payload,
      ),
    );
    return response.data;
  }

  async updateCredential(
    institutionId: number,
    credentialId: number,
    payload: InstitutionSecurityCredentialUpdate,
  ): Promise<InstitutionCredential> {
    const response = await this.retryRequest(() =>
      this.client.put<InstitutionCredential>(
        `/api/v1/institutions/${institutionId}/credentials/${credentialId}`,
        payload,
      ),
    );
    return response.data;
  }

  async deleteCredential(institutionId: number, credentialId: number): Promise<void> {
    await this.retryRequest(() =>
      this.client.delete(
        `/api/v1/institutions/${institutionId}/credentials/${credentialId}`,
      ),
    );
  }
}

export const institutionCredentialsService = new InstitutionCredentialsService();
