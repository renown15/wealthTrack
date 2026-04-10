/**
 * Service for share sale API operations.
 */
import type { ShareSaleRequest, ShareSaleResponse } from '@models/ShareSaleModels';
import { BaseApiClient } from '@services/BaseApiClient';

class ShareSaleService extends BaseApiClient {
  async recordSale(data: ShareSaleRequest): Promise<ShareSaleResponse> {
    try {
      const response = await this.retryRequest(() =>
        this.client.post<ShareSaleResponse>('/api/v1/accounts/share-sale', data),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to record share sale');
    }
  }
}

export const shareSaleService = new ShareSaleService();
