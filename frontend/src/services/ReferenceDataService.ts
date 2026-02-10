import type { ReferenceDataItem } from '@/models/ReferenceData';
import { BaseApiClient } from '@services/BaseApiClient';

class ReferenceDataService extends BaseApiClient {
  async listByClass(classKey: string): Promise<ReferenceDataItem[]> {
    const response = await this.retryRequest(() =>
      this.client.get<ReferenceDataItem[]>(`/api/v1/reference-data/${classKey}`),
    );
    return response.data;
  }
}

export const referenceDataService = new ReferenceDataService();