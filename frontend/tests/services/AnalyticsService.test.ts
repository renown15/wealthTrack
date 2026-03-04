/**
 * Unit tests for AnalyticsService
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { analyticsService } from '@/services/AnalyticsService';

type AxiosStub = {
  get: Mock<unknown[], Promise<{ data: unknown }>>;
};

describe('AnalyticsService', () => {
  let clientStub: AxiosStub;

  beforeEach(() => {
    vi.clearAllMocks();
    clientStub = {
      get: vi.fn().mockResolvedValue({ data: null }),
    };
    analyticsService.client = clientStub as never;
  });

  it('fetches portfolio breakdown', async () => {
    const breakdown = { byType: [], byInstitution: [], total: 0 };
    clientStub.get.mockResolvedValueOnce({ data: breakdown });

    await expect(analyticsService.getBreakdown()).resolves.toEqual(breakdown);
    expect(clientStub.get).toHaveBeenCalledWith('/api/v1/analytics/breakdown');
  });

  it('fetches portfolio history', async () => {
    const history = { history: [{ date: '2024-01-01', totalValue: 1000 }] };
    clientStub.get.mockResolvedValueOnce({ data: history });

    await expect(analyticsService.getPortfolioHistory()).resolves.toEqual(history);
    expect(clientStub.get).toHaveBeenCalledWith('/api/v1/analytics/portfolio-history');
  });

  it('throws on getBreakdown failure', async () => {
    clientStub.get.mockRejectedValueOnce(new Error('Network error'));
    await expect(analyticsService.getBreakdown()).rejects.toThrow();
  });

  it('throws on getPortfolioHistory failure', async () => {
    clientStub.get.mockRejectedValueOnce(new Error('Network error'));
    await expect(analyticsService.getPortfolioHistory()).rejects.toThrow();
  });
});
