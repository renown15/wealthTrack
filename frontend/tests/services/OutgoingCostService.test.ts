import { describe, it, expect, beforeEach, vi } from 'vitest';
import { outgoingCostService } from '@services/OutgoingCostService';

const clientStub = {
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
};

const mockActual = { groupId: 5, accountId: 10, amount: '142.50', costDate: '2026-06-01' };
const mockProjection = { accountId: 10, projectedCost: '120.00', actualsCount: 3 };

describe('OutgoingCostService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    outgoingCostService.client = clientStub as never;
  });

  describe('recordActualCost', () => {
    it('posts the actual and returns the created item', async () => {
      clientStub.post.mockResolvedValue({ data: mockActual });
      const data = { amount: '142.50', cost_date: '2026-06-01' };
      const result = await outgoingCostService.recordActualCost(10, data);
      expect(result).toStrictEqual(mockActual);
      expect(clientStub.post).toHaveBeenCalledWith('/api/v1/accounts/10/actual-costs', data);
    });

    it('throws on error', async () => {
      clientStub.post.mockRejectedValue(new Error('Server error'));
      await expect(
        outgoingCostService.recordActualCost(10, { amount: '1', cost_date: '2026-01-01' }),
      ).rejects.toThrow();
    });
  });

  describe('listActualCosts', () => {
    it('returns recorded actuals', async () => {
      clientStub.get.mockResolvedValue({ data: [mockActual] });
      const result = await outgoingCostService.listActualCosts(10);
      expect(result).toStrictEqual([mockActual]);
      expect(clientStub.get).toHaveBeenCalledWith('/api/v1/accounts/10/actual-costs');
    });

    it('throws on error', async () => {
      clientStub.get.mockRejectedValue(new Error('Server error'));
      await expect(outgoingCostService.listActualCosts(10)).rejects.toThrow();
    });
  });

  describe('deleteActualCost', () => {
    it('deletes by group id', async () => {
      clientStub.delete.mockResolvedValue({});
      await outgoingCostService.deleteActualCost(5);
      expect(clientStub.delete).toHaveBeenCalledWith('/api/v1/outgoings/actual-costs/5');
    });

    it('throws on error', async () => {
      clientStub.delete.mockRejectedValue(new Error('Server error'));
      await expect(outgoingCostService.deleteActualCost(5)).rejects.toThrow();
    });
  });

  describe('getProjections', () => {
    it('returns projections', async () => {
      clientStub.get.mockResolvedValue({ data: [mockProjection] });
      const result = await outgoingCostService.getProjections();
      expect(result).toStrictEqual([mockProjection]);
      expect(clientStub.get).toHaveBeenCalledWith('/api/v1/outgoings/projections');
    });

    it('throws on error', async () => {
      clientStub.get.mockRejectedValue(new Error('Server error'));
      await expect(outgoingCostService.getProjections()).rejects.toThrow();
    });
  });
});
