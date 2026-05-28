import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFamily } from '@composables/useFamily';
import { apiService } from '@services/ApiService';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    getFamilies: vi.fn(),
    createFamily: vi.fn(),
    renameFamily: vi.fn(),
    deleteFamily: vi.fn(),
    getAvailableMembers: vi.fn(),
    addFamilyMember: vi.fn(),
    removeFamilyMember: vi.fn(),
  },
}));

const mockApi = vi.mocked(apiService);

const mockMember = { id: 1, accountId: 10, firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' };
const mockFamily = {
  id: 1, name: 'My Family', ownerId: 10, isOwner: true,
  members: [mockMember], createdAt: '', updatedAt: null,
};
const mockUser = { id: 5, firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com' };

describe('useFamily', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getAvailableMembers.mockResolvedValue([]);
  });

  describe('loadFamily', () => {
    it('sets family from first result', async () => {
      mockApi.getFamilies.mockResolvedValue([mockFamily]);
      const { state, loadFamily } = useFamily();
      await loadFamily();
      expect(state.family).toStrictEqual(mockFamily);
      expect(state.loading).toBe(false);
    });

    it('sets family to null when no families', async () => {
      mockApi.getFamilies.mockResolvedValue([]);
      const { state, loadFamily } = useFamily();
      await loadFamily();
      expect(state.family).toBeNull();
    });

    it('sets error on failure', async () => {
      mockApi.getFamilies.mockRejectedValue(new Error('Network'));
      const { state, loadFamily } = useFamily();
      await loadFamily();
      expect(state.error).toBe('Network');
      expect(state.family).toBeNull();
    });
  });

  describe('createFamily', () => {
    it('stores created family and returns true', async () => {
      mockApi.createFamily.mockResolvedValue(mockFamily);
      const { state, createFamily } = useFamily();
      const ok = await createFamily('My Family');
      expect(ok).toBe(true);
      expect(state.family).toStrictEqual(mockFamily);
    });

    it('sets error and returns false on failure', async () => {
      mockApi.createFamily.mockRejectedValue(new Error('Already exists'));
      const { state, createFamily } = useFamily();
      const ok = await createFamily('My Family');
      expect(ok).toBe(false);
      expect(state.error).toBe('Already exists');
    });
  });

  describe('renameFamily', () => {
    it('updates family name', async () => {
      const renamed = { ...mockFamily, name: 'Renamed' };
      mockApi.renameFamily.mockResolvedValue(renamed);
      const { state, renameFamily } = useFamily();
      state.family = mockFamily;
      const ok = await renameFamily('Renamed');
      expect(ok).toBe(true);
      expect(state.family?.name).toBe('Renamed');
    });

    it('returns false when no family', async () => {
      const { renameFamily } = useFamily();
      const ok = await renameFamily('Renamed');
      expect(ok).toBe(false);
    });
  });

  describe('deleteFamily', () => {
    it('clears family on success', async () => {
      mockApi.deleteFamily.mockResolvedValue(undefined);
      const { state, deleteFamily } = useFamily();
      state.family = mockFamily;
      const ok = await deleteFamily();
      expect(ok).toBe(true);
      expect(state.family).toBeNull();
    });
  });

  describe('addMember', () => {
    it('updates family after adding member', async () => {
      const updated = { ...mockFamily, members: [...mockFamily.members, mockMember] };
      mockApi.addFamilyMember.mockResolvedValue(updated);
      const { state, addMember } = useFamily();
      state.family = mockFamily;
      const ok = await addMember(5);
      expect(ok).toBe(true);
      expect(state.family).toStrictEqual(updated);
    });
  });

  describe('removeMember', () => {
    it('updates family after removing member', async () => {
      const updated = { ...mockFamily, members: [] };
      mockApi.removeFamilyMember.mockResolvedValue(updated);
      const { state, removeMember } = useFamily();
      state.family = mockFamily;
      const ok = await removeMember(1);
      expect(ok).toBe(true);
      expect(state.family?.members).toHaveLength(0);
    });
  });

  describe('loadAvailableMembers', () => {
    it('populates availableMembers', async () => {
      mockApi.getAvailableMembers.mockResolvedValue([mockUser]);
      const { state, loadAvailableMembers } = useFamily();
      state.family = mockFamily;
      await loadAvailableMembers();
      expect(state.availableMembers).toStrictEqual([mockUser]);
    });

    it('does nothing when no family', async () => {
      const { state, loadAvailableMembers } = useFamily();
      await loadAvailableMembers();
      expect(mockApi.getAvailableMembers).not.toHaveBeenCalled();
      expect(state.availableMembers).toHaveLength(0);
    });
  });
});
