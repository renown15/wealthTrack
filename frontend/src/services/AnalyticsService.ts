/**
 * Service for analytics API calls.
 */
import type { PortfolioBreakdown, PortfolioHistory } from '@models/WealthTrackDataModels';
import { BaseApiClient } from '@services/BaseApiClient';

class AnalyticsService extends BaseApiClient {
  async getBreakdown(): Promise<PortfolioBreakdown> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<PortfolioBreakdown>('/api/v1/analytics/breakdown'),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch portfolio breakdown');
    }
  }

  async getPortfolioHistory(): Promise<PortfolioHistory> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<PortfolioHistory>('/api/v1/analytics/portfolio-history'),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch portfolio history');
    }
  }
}

export const analyticsService = new AnalyticsService();
