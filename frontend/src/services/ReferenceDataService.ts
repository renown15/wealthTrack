import type { ReferenceDataItem } from '@/models/ReferenceData';
import { BaseApiClient } from '@services/BaseApiClient';
import { authService } from '@/services/AuthService';

export interface ReferenceDataPayload {
  classKey: string;
  referenceValue: string;
  sortIndex?: number;
}

class ReferenceDataService extends BaseApiClient {
  private syncAuthToken(): void {
    const token = authService.getAuthToken();
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  async listByClass(classKey: string): Promise<ReferenceDataItem[]> {
    const response = await this.retryRequest(() =>
      this.client.get<ReferenceDataItem[]>(`/api/v1/reference-data/${classKey}`),
    );
    return response.data;
  }

  async listAll(): Promise<ReferenceDataItem[]> {
    this.syncAuthToken();
    const response = await this.retryRequest(() =>
      this.client.get<ReferenceDataItem[]>('/api/v1/reference-data'),
    );
    return response.data;
  }

  async create(payload: ReferenceDataPayload): Promise<ReferenceDataItem> {
    this.syncAuthToken();
    const response = await this.retryRequest(() =>
      this.client.post<ReferenceDataItem>('/api/v1/reference-data', payload),
    );
    return response.data;
  }

  async update(id: number, payload: ReferenceDataPayload): Promise<ReferenceDataItem> {
    this.syncAuthToken();
    const response = await this.retryRequest(() =>
      this.client.put<ReferenceDataItem>(`/api/v1/reference-data/${id}`, payload),
    );
    return response.data;
  }

  async delete(id: number): Promise<void> {
    this.syncAuthToken();
    await this.retryRequest(() =>
      this.client.delete(`/api/v1/reference-data/${id}`),
    );
  }
}

export const referenceDataService = new ReferenceDataService();