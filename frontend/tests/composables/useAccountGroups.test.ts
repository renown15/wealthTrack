import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAccountGroups } from '@composables/useAccountGroups';
import { apiService } from '@services/ApiService';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    getAccountGroups: vi.fn(),
    getGroupMembers: vi.fn(),
    createAccountGroup: vi.fn(),
    updateAccountGroup: vi.fn(),
    deleteAccountGroup: vi.fn(),
    addAccountToGroup: vi.fn(),
    removeAccountFromGroup: vi.fn(),
  },
}));

const mockApi = vi.mocked(apiService);

const mockGroup = { id: 1, name: 'Group A', userId: 1, createdAt: '', updatedAt: '' };
const mockGroup2 = { id: 2, name: 'Group B', userId: 1, createdAt: '', updatedAt: '' };

describe('useAccountGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getGroupMembers.mockResolvedValue([]);
  });

  describe('loadGroups', () => {
    it('loads groups and their members', async () => {
      mockApi.getAccountGroups.mockResolvedValue([mockGroup]);
      mockApi.getGroupMembers.mockResolvedValue([10, 20]);
      const { state, loadGroups } = useAccountGroups();
      await loadGroups();
      expect(state.groups).toHaveLength(1);
      expect(state.groupMembers.get(1)).toEqual([10, 20]);
      expect(state.loading).toBe(false);
    });

    it('sets error on failure', async () => {
      mockApi.getAccountGroups.mockRejectedValue(new Error('Network error'));
      const { state, loadGroups } = useAccountGroups();
      await loadGroups();
      expect(state.error).toBe('Network error');
      expect(state.groups).toHaveLength(0);
    });

    it('handles members endpoint failure gracefully', async () => {
      mockApi.getAccountGroups.mockResolvedValue([mockGroup]);
      mockApi.getGroupMembers.mockRejectedValue(new Error('Not found'));
      const { state, loadGroups } = useAccountGroups();
      await loadGroups();
      expect(state.groupMembers.get(1)).toEqual([]);
    });
  });

  describe('createGroup', () => {
    it('adds the new group to state', async () => {
      mockApi.createAccountGroup.mockResolvedValue(mockGroup);
      const { state, createGroup } = useAccountGroups();
      const result = await createGroup('Group A');
      expect(result).toStrictEqual(mockGroup);
      expect(state.groups).toContainEqual(mockGroup);
    });

    it('returns null and sets error on failure', async () => {
      mockApi.createAccountGroup.mockRejectedValue(new Error('Conflict'));
      const { state, createGroup } = useAccountGroups();
      const result = await createGroup('Group A');
      expect(result).toBeNull();
      expect(state.error).toBe('Conflict');
    });
  });

  describe('updateGroup', () => {
    it('replaces the group in state', async () => {
      const updated = { ...mockGroup, name: 'Renamed' };
      mockApi.updateAccountGroup.mockResolvedValue(updated);
      const { state, updateGroup } = useAccountGroups();
      state.groups = [mockGroup];
      const result = await updateGroup(1, 'Renamed');
      expect(result).toStrictEqual(updated);
      expect(state.groups[0].name).toBe('Renamed');
    });

    it('returns null on failure', async () => {
      mockApi.updateAccountGroup.mockRejectedValue(new Error('Not found'));
      const { updateGroup } = useAccountGroups();
      const result = await updateGroup(99, 'X');
      expect(result).toBeNull();
    });
  });

  describe('deleteGroup', () => {
    it('removes group from state and returns true', async () => {
      mockApi.deleteAccountGroup.mockResolvedValue(undefined);
      const { state, deleteGroup } = useAccountGroups();
      state.groups = [mockGroup, mockGroup2];
      const result = await deleteGroup(1);
      expect(result).toBe(true);
      expect(state.groups).toHaveLength(1);
    });

    it('returns false on failure', async () => {
      mockApi.deleteAccountGroup.mockRejectedValue(new Error('Forbidden'));
      const { deleteGroup } = useAccountGroups();
      const result = await deleteGroup(1);
      expect(result).toBe(false);
    });
  });

  describe('addAccountToGroup', () => {
    it('returns true on success', async () => {
      mockApi.addAccountToGroup.mockResolvedValue(undefined);
      const { addAccountToGroup } = useAccountGroups();
      const result = await addAccountToGroup(1, 10);
      expect(result).toBe(true);
    });

    it('returns false on failure', async () => {
      mockApi.addAccountToGroup.mockRejectedValue(new Error('Error'));
      const { addAccountToGroup } = useAccountGroups();
      const result = await addAccountToGroup(1, 10);
      expect(result).toBe(false);
    });
  });

  describe('removeAccountFromGroup', () => {
    it('returns true on success', async () => {
      mockApi.removeAccountFromGroup.mockResolvedValue(undefined);
      const { removeAccountFromGroup } = useAccountGroups();
      const result = await removeAccountFromGroup(1, 10);
      expect(result).toBe(true);
    });

    it('returns false on failure', async () => {
      mockApi.removeAccountFromGroup.mockRejectedValue(new Error('Error'));
      const { removeAccountFromGroup } = useAccountGroups();
      const result = await removeAccountFromGroup(1, 10);
      expect(result).toBe(false);
    });
  });

  describe('saveGroupMembers', () => {
    it('adds new and removes deleted members', async () => {
      mockApi.addAccountToGroup.mockResolvedValue(undefined);
      mockApi.removeAccountFromGroup.mockResolvedValue(undefined);
      const { saveGroupMembers } = useAccountGroups();
      const result = await saveGroupMembers(1, [10, 20], [20, 30]);
      expect(result).toBe(true);
      expect(mockApi.addAccountToGroup).toHaveBeenCalledWith(1, 10);
      expect(mockApi.removeAccountFromGroup).toHaveBeenCalledWith(1, 30);
    });
  });

  describe('groupById', () => {
    it('returns a computed ref for the matching group', () => {
      const { state, groupById } = useAccountGroups();
      state.groups = [mockGroup, mockGroup2];
      expect(groupById(1).value).toStrictEqual(mockGroup);
      expect(groupById(99).value).toBeUndefined();
    });
  });
});
