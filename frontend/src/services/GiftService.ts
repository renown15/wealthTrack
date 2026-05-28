/** API client for gift recording and IHT taper endpoints */
import type { GiftSummary, RecordGiftRequest, RecordGiftResponse } from '@models/gift';
import { BaseApiClient } from '@services/BaseApiClient';

class GiftService extends BaseApiClient {
  async recordGift(accountId: number, data: RecordGiftRequest): Promise<RecordGiftResponse> {
    try {
      const response = await this.retryRequest(() =>
        this.client.post<RecordGiftResponse>(`/api/v1/accounts/${accountId}/gifts`, data),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to record gift');
    }
  }

  async listGifts(): Promise<GiftSummary[]> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<GiftSummary[]>('/api/v1/gifts'),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch gifts');
    }
  }

  async deleteGift(groupId: number): Promise<void> {
    try {
      await this.retryRequest(() =>
        this.client.delete(`/api/v1/gifts/${groupId}`),
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to delete gift');
    }
  }

  async deleteGiftByEventId(eventId: number): Promise<void> {
    try {
      await this.retryRequest(() =>
        this.client.delete(`/api/v1/gifts/by-event/${eventId}`),
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to delete gift');
    }
  }
}

export const giftService = new GiftService();
