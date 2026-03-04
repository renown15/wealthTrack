import { describe, it, expect, beforeEach, vi } from 'vitest';
import { portfolioFetchService } from '@services/PortfolioFetchService';

const clientStub = {
  get: vi.fn(),
};

const mockPortfolio = {
  items: [],
  institutions: [],
};

describe('PortfolioFetchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    portfolioFetchService.client = clientStub as never;
  });

  describe('getPortfolio', () => {
    it('returns portfolio data on success', async () => {
      clientStub.get.mockResolvedValue({ data: mockPortfolio });
      const result = await portfolioFetchService.getPortfolio();
      expect(result).toStrictEqual(mockPortfolio);
      expect(clientStub.get).toHaveBeenCalledWith('/api/v1/portfolio');
    });

    it('throws on error', async () => {
      clientStub.get.mockRejectedValue(new Error('Unauthorized'));
      await expect(portfolioFetchService.getPortfolio()).rejects.toThrow();
    });
  });
});
