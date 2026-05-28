import { describe, it, expect, beforeEach, vi } from 'vitest';
import { familyService } from '@services/FamilyService';

const clientStub = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

const mockMember = { id: 1, accountId: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' };
const mockFamily = {
  id: 1, name: 'The Smiths', ownerId: 10, isOwner: true,
  members: [mockMember], createdAt: '', updatedAt: null,
};
const mockUser = { id: 5, firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com' };

describe('FamilyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    familyService.client = clientStub as never;
  });

  describe('getFamilies', () => {
    it('returns family list', async () => {
      clientStub.get.mockResolvedValue({ data: [mockFamily] });
      const result = await familyService.getFamilies();
      expect(result).toEqual([mockFamily]);
      expect(clientStub.get).toHaveBeenCalledWith('/api/v1/families');
    });

    it('throws on error', async () => {
      clientStub.get.mockRejectedValue(new Error('Network'));
      await expect(familyService.getFamilies()).rejects.toThrow();
    });
  });

  describe('createFamily', () => {
    it('posts name and returns family', async () => {
      clientStub.post.mockResolvedValue({ data: mockFamily });
      const result = await familyService.createFamily('The Smiths');
      expect(result).toStrictEqual(mockFamily);
      expect(clientStub.post).toHaveBeenCalledWith('/api/v1/families', { name: 'The Smiths' });
    });
  });

  describe('renameFamily', () => {
    it('puts name update and returns updated family', async () => {
      const updated = { ...mockFamily, name: 'The Joneses' };
      clientStub.put.mockResolvedValue({ data: updated });
      const result = await familyService.renameFamily(1, 'The Joneses');
      expect(result.name).toBe('The Joneses');
      expect(clientStub.put).toHaveBeenCalledWith('/api/v1/families/1', { name: 'The Joneses' });
    });
  });

  describe('deleteFamily', () => {
    it('sends delete request', async () => {
      clientStub.delete.mockResolvedValue({ data: undefined });
      await familyService.deleteFamily(1);
      expect(clientStub.delete).toHaveBeenCalledWith('/api/v1/families/1');
    });
  });

  describe('getAvailableMembers', () => {
    it('returns user summaries', async () => {
      clientStub.get.mockResolvedValue({ data: [mockUser] });
      const result = await familyService.getAvailableMembers(1);
      expect(result).toEqual([mockUser]);
      expect(clientStub.get).toHaveBeenCalledWith('/api/v1/families/1/available-members');
    });
  });

  describe('addMember', () => {
    it('posts accountId and returns updated family', async () => {
      clientStub.post.mockResolvedValue({ data: mockFamily });
      const result = await familyService.addMember(1, 5);
      expect(result).toStrictEqual(mockFamily);
      expect(clientStub.post).toHaveBeenCalledWith('/api/v1/families/1/members', { accountId: 5 });
    });
  });

  describe('removeMember', () => {
    it('deletes member and returns updated family', async () => {
      clientStub.delete.mockResolvedValue({ data: mockFamily });
      const result = await familyService.removeMember(1, 2);
      expect(result).toStrictEqual(mockFamily);
      expect(clientStub.delete).toHaveBeenCalledWith('/api/v1/families/1/members/2');
    });
  });

  describe('getMemberPortfolio', () => {
    it('fetches member portfolio', async () => {
      const portfolio = { items: [], totalValue: 0, accountCount: 0, lastPriceUpdate: null };
      clientStub.get.mockResolvedValue({ data: portfolio });
      const result = await familyService.getMemberPortfolio(1, 2);
      expect(result).toStrictEqual(portfolio);
      expect(clientStub.get).toHaveBeenCalledWith('/api/v1/families/1/members/2/portfolio');
    });
  });
});
