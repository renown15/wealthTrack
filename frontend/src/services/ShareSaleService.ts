/**
 * Service for share sale API operations.
 */
import type { ShareSaleRequest, ShareSaleResponse, ShareSaleSummary } from '@models/ShareSaleModels';
import { BaseApiClient } from '@services/BaseApiClient';
import { debug } from '@utils/debug';

class ShareSaleService extends BaseApiClient {
  async recordSale(data: ShareSaleRequest): Promise<ShareSaleResponse> {
    try {
      debug.log('[ShareSaleService] Recording share sale with payload:', {
        sharesAccountId: data.sharesAccountId,
        cashAccountId: data.cashAccountId,
        taxLiabilityAccountId: data.taxLiabilityAccountId,
        sharesSold: data.sharesSold,
        salePricePerShare: data.salePricePerShare,
        salePricePerShareType: typeof data.salePricePerShare,
      });

      // Explicitly ensure we're sending the right types
      const payload = {
        sharesAccountId: Number(data.sharesAccountId),
        cashAccountId: Number(data.cashAccountId),
        taxLiabilityAccountId: Number(data.taxLiabilityAccountId),
        sharesSold: String(data.sharesSold),
        salePricePerShare: String(data.salePricePerShare),
      };

      debug.log('[ShareSaleService] Final payload before HTTP:', JSON.stringify(payload));

      const response = await this.retryRequest(() =>
        this.client.post<ShareSaleResponse>('/api/v1/accounts/share-sale', payload),
      );

      debug.log('[ShareSaleService] Share sale recorded successfully:', response.data);
      return response.data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      debug.error('[ShareSaleService] Failed to record share sale', { error: errorMsg, payload: data });
      throw this.handleError(error, 'Failed to record share sale');
    }
  }
  async getHistory(accountId: number): Promise<ShareSaleSummary[]> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<ShareSaleSummary[]>(`/api/v1/accounts/${accountId}/share-sales`),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to load share sale history');
    }
  }
}

export const shareSaleService = new ShareSaleService();
