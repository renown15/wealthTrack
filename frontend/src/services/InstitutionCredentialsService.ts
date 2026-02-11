import type { InstitutionCredential } from '@/models/InstitutionCredential';
import type {
  InstitutionSecurityCredentialCreate,
  InstitutionSecurityCredentialUpdate,
} from '@/models/InstitutionCredentialPayloads';
import { BaseApiClient } from '@services/BaseApiClient';
import { authService } from '@/services/AuthService';

class InstitutionCredentialsService extends BaseApiClient {
  private syncAuthToken(): void {
    const token = authService.getAuthToken();
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  async listCredentials(institutionId: number): Promise<InstitutionCredential[]> {
    this.syncAuthToken();
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
    this.syncAuthToken();
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
    this.syncAuthToken();
    const response = await this.retryRequest(() =>
      this.client.put<InstitutionCredential>(
        `/api/v1/institutions/${institutionId}/credentials/${credentialId}`,
        payload,
      ),
    );
    return response.data;
  }

  async deleteCredential(institutionId: number, credentialId: number): Promise<void> {
    this.syncAuthToken();
    await this.retryRequest(() =>
      this.client.delete(
        `/api/v1/institutions/${institutionId}/credentials/${credentialId}`,
      ),
    );
  }
}

export const institutionCredentialsService = new InstitutionCredentialsService();
