import { describe, it, expect, beforeEach, vi } from 'vitest';
import { accountGroupCrudService } from '@services/AccountGroupCrudService';

const clientStub = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

const mockGroup = { id: 1, name: 'Group A', userId: 1, createdAt: '', updatedAt: '' };

describe('AccountGroupCrudService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    accountGroupCrudService.client = clientStub as never;
  });

  describe('getAccountGroups', () => {
    it('returns account groups', async () => {
      clientStub.get.mockResolvedValue({ data: [mockGroup] });
      const result = await accountGroupCrudService.getAccountGroups();
      expect(result).toEqual([mockGroup]);
      expect(clientStub.get).toHaveBeenCalledWith('/api/v1/account-groups');
    });

    it('throws on error', async () => {
      clientStub.get.mockRejectedValue(new Error('Network'));
      await expect(accountGroupCrudService.getAccountGroups()).rejects.toThrow();
    });
  });

  describe('getAccountGroup', () => {
    it('fetches a single group by id', async () => {
      clientStub.get.mockResolvedValue({ data: mockGroup });
      const result = await accountGroupCrudService.getAccountGroup(1);
      expect(result).toStrictEqual(mockGroup);
      expect(clientStub.get).toHaveBeenCalledWith('/api/v1/account-groups/1');
    });
  });

  describe('createAccountGroup', () => {
    it('creates and returns new group', async () => {
      clientStub.post.mockResolvedValue({ data: mockGroup });
      const result = await accountGroupCrudService.createAccountGroup({ name: 'Group A' });
      expect(result).toStrictEqual(mockGroup);
      expect(clientStub.post).toHaveBeenCalledWith('/api/v1/account-groups', { name: 'Group A' });
    });
  });

  describe('updateAccountGroup', () => {
    it('updates and returns updated group', async () => {
      const updated = { ...mockGroup, name: 'Renamed' };
      clientStub.put.mockResolvedValue({ data: updated });
      const result = await accountGroupCrudService.updateAccountGroup(1, { name: 'Renamed' });
      expect(result.name).toBe('Renamed');
      expect(clientStub.put).toHaveBeenCalledWith('/api/v1/account-groups/1', { name: 'Renamed' });
    });
  });

  describe('deleteAccountGroup', () => {
    it('calls delete endpoint', async () => {
      clientStub.delete.mockResolvedValue({ data: null });
      await accountGroupCrudService.deleteAccountGroup(1);
      expect(clientStub.delete).toHaveBeenCalledWith('/api/v1/account-groups/1');
    });

    it('throws on error', async () => {
      clientStub.delete.mockRejectedValue(new Error('Forbidden'));
      await expect(accountGroupCrudService.deleteAccountGroup(1)).rejects.toThrow();
    });
  });

  describe('addAccountToGroup', () => {
    it('posts to members endpoint', async () => {
      clientStub.post.mockResolvedValue({ data: null });
      await accountGroupCrudService.addAccountToGroup(1, 10);
      expect(clientStub.post).toHaveBeenCalledWith(
        '/api/v1/account-groups/1/members/10', {}
      );
    });
  });

  describe('removeAccountFromGroup', () => {
    it('deletes from members endpoint', async () => {
      clientStub.delete.mockResolvedValue({ data: null });
      await accountGroupCrudService.removeAccountFromGroup(1, 10);
      expect(clientStub.delete).toHaveBeenCalledWith(
        '/api/v1/account-groups/1/members/10'
      );
    });
  });

  describe('getGroupMembers', () => {
    it('returns accountIds array', async () => {
      clientStub.get.mockResolvedValue({ data: { accountIds: [10, 20] } });
      const result = await accountGroupCrudService.getGroupMembers(1);
      expect(result).toEqual([10, 20]);
    });

    it('returns empty array when accountIds missing', async () => {
      clientStub.get.mockResolvedValue({ data: {} });
      const result = await accountGroupCrudService.getGroupMembers(1);
      expect(result).toEqual([]);
    });
  });
});
