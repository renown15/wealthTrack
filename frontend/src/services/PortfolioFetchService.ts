/**
 * Portfolio service for fetching user portfolio data.
 */
import type { Portfolio } from '@models/Portfolio';
import { BaseApiClient } from '@services/BaseApiClient';

class PortfolioFetchService extends BaseApiClient {
  /**
   * Get user portfolio with all accounts and institutions.
   */
  async getPortfolio(): Promise<Portfolio> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<Portfolio>('/api/v1/portfolio'),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch portfolio');
    }
  }
}

export const portfolioFetchService = new PortfolioFetchService();
