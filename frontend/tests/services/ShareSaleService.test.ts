import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shareSaleService } from '@services/ShareSaleService';

vi.mock('@utils/debug', () => ({ debug: { log: vi.fn(), error: vi.fn() } }));

const clientStub = { post: vi.fn(), get: vi.fn() };

const mockRequest = {
  sharesAccountId: 1,
  cashAccountId: 2,
  taxLiabilityAccountId: 3,
  sharesSold: '100',
  salePricePerShare: '15.50',
};

const mockSaleResponse = {
  sharesSold: '100',
  salePricePerShare: '15.50',
  proceeds: '1550.00',
  purchasePricePerShare: '10.00',
  capitalGain: '550.00',
  cgtRate: '0.20',
  cgt: '110.00',
  cashNewBalance: '11550.00',
  taxLiabilityNewBalance: '110.00',
};

describe('ShareSaleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shareSaleService.client = clientStub as never;
  });

  describe('recordSale', () => {
    it('posts share sale and returns response', async () => {
      clientStub.post.mockResolvedValue({ data: mockSaleResponse });
      const result = await shareSaleService.recordSale(mockRequest);
      expect(result).toStrictEqual(mockSaleResponse);
      expect(clientStub.post).toHaveBeenCalledWith(
        '/api/v1/accounts/share-sale',
        expect.objectContaining({
          sharesAccountId: 1,
          cashAccountId: 2,
          taxLiabilityAccountId: 3,
          sharesSold: '100',
          salePricePerShare: '15.50',
        }),
      );
    });

    it('coerces numeric IDs to numbers and amounts to strings', async () => {
      clientStub.post.mockResolvedValue({ data: mockSaleResponse });
      await shareSaleService.recordSale(mockRequest);
      const [, payload] = clientStub.post.mock.calls[0] as [string, Record<string, unknown>];
      expect(typeof payload.sharesAccountId).toBe('number');
      expect(typeof payload.sharesSold).toBe('string');
    });

    it('throws on error', async () => {
      clientStub.post.mockRejectedValue(new Error('Server error'));
      await expect(shareSaleService.recordSale(mockRequest)).rejects.toThrow();
    });
  });

  describe('getHistory', () => {
    it('returns share sale summaries for an account', async () => {
      const summaries = [{ groupId: 1, soldAt: '2025-01-01', events: [], attributes: [] }];
      clientStub.get.mockResolvedValue({ data: summaries });
      const result = await shareSaleService.getHistory(5);
      expect(result).toStrictEqual(summaries);
      expect(clientStub.get).toHaveBeenCalledWith('/api/v1/accounts/5/share-sales');
    });

    it('throws on error', async () => {
      clientStub.get.mockRejectedValue(new Error('Not found'));
      await expect(shareSaleService.getHistory(5)).rejects.toThrow();
    });
  });
});
