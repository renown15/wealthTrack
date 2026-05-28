import { describe, it, expect, beforeEach, vi } from 'vitest';
import { giftService } from '@services/GiftService';

const clientStub = {
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
};

const mockGift = {
  groupId: 1, accountId: 10, accountName: 'Current Account',
  donor: 'Grandparent', giftDate: '2022-03-15', giftValueGbp: '5000.00',
  numShares: null, yearsElapsed: 3.2, ihtRate: '0.32', ihtExposure: '1600.00',
};

const mockResponse = {
  groupId: 1, accountId: 10, donor: 'Grandparent',
  giftDate: '2022-03-15', giftValueGbp: '5000.00', numShares: null,
};

describe('GiftService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    giftService.client = clientStub as never;
  });

  describe('recordGift', () => {
    it('posts gift data and returns response', async () => {
      clientStub.post.mockResolvedValue({ data: mockResponse });
      const data = { donor: 'Grandparent', giftDate: '2022-03-15', giftValueGbp: '5000.00', numShares: null };
      const result = await giftService.recordGift(10, data);
      expect(result).toStrictEqual(mockResponse);
      expect(clientStub.post).toHaveBeenCalledWith('/api/v1/accounts/10/gifts', data);
    });

    it('throws on error', async () => {
      clientStub.post.mockRejectedValue(new Error('Server error'));
      await expect(giftService.recordGift(1, { donor: 'X', giftDate: '2024-01-01', giftValueGbp: '100', numShares: null })).rejects.toThrow();
    });
  });

  describe('listGifts', () => {
    it('returns list of gift summaries', async () => {
      clientStub.get.mockResolvedValue({ data: [mockGift] });
      const result = await giftService.listGifts();
      expect(result).toStrictEqual([mockGift]);
      expect(clientStub.get).toHaveBeenCalledWith('/api/v1/gifts');
    });

    it('throws on error', async () => {
      clientStub.get.mockRejectedValue(new Error('Not found'));
      await expect(giftService.listGifts()).rejects.toThrow();
    });
  });

  describe('deleteGift', () => {
    it('sends DELETE request for the given group id', async () => {
      clientStub.delete.mockResolvedValue({});
      await giftService.deleteGift(42);
      expect(clientStub.delete).toHaveBeenCalledWith('/api/v1/gifts/42');
    });

    it('throws on error', async () => {
      clientStub.delete.mockRejectedValue(new Error('Not found'));
      await expect(giftService.deleteGift(1)).rejects.toThrow();
    });
  });

  describe('deleteGiftByEventId', () => {
    it('sends DELETE request to by-event endpoint', async () => {
      clientStub.delete.mockResolvedValue({});
      await giftService.deleteGiftByEventId(99);
      expect(clientStub.delete).toHaveBeenCalledWith('/api/v1/gifts/by-event/99');
    });

    it('throws on error', async () => {
      clientStub.delete.mockRejectedValue(new Error('Not found'));
      await expect(giftService.deleteGiftByEventId(1)).rejects.toThrow();
    });
  });
});
