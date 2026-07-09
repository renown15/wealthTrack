/** API client for outgoing actual costs and provision projections */
import type { ActualCostCreateRequest, ActualCostItem, OutgoingProjection } from '@models/outgoing';
import { BaseApiClient } from '@services/BaseApiClient';

class OutgoingCostService extends BaseApiClient {
  async recordActualCost(accountId: number, data: ActualCostCreateRequest): Promise<ActualCostItem> {
    try {
      const response = await this.retryRequest(() =>
        this.client.post<ActualCostItem>(`/api/v1/accounts/${accountId}/actual-costs`, data),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to record actual cost');
    }
  }

  async listActualCosts(accountId: number): Promise<ActualCostItem[]> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<ActualCostItem[]>(`/api/v1/accounts/${accountId}/actual-costs`),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch actual costs');
    }
  }

  async deleteActualCost(groupId: number): Promise<void> {
    try {
      await this.retryRequest(() =>
        this.client.delete(`/api/v1/outgoings/actual-costs/${groupId}`),
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to delete actual cost');
    }
  }

  async getProjections(): Promise<OutgoingProjection[]> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<OutgoingProjection[]>('/api/v1/outgoings/projections'),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch outgoing projections');
    }
  }
}

export const outgoingCostService = new OutgoingCostService();
