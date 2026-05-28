/** Composable for managing a user's family — create, rename, delete, add/remove members */
import { reactive } from 'vue';
import { apiService } from '@services/ApiService';
import { debug } from '@utils/debug';
import type { Family, UserSummary } from '@models/family';

export interface FamilyState {
  family: Family | null;
  availableMembers: UserSummary[];
  loading: boolean;
  error: string | null;
}

export function useFamily(): {
  state: FamilyState;
  loadFamily: () => Promise<void>;
  createFamily: (name: string) => Promise<boolean>;
  renameFamily: (name: string) => Promise<boolean>;
  deleteFamily: () => Promise<boolean>;
  loadAvailableMembers: () => Promise<void>;
  addMember: (accountId: number) => Promise<boolean>;
  removeMember: (memberId: number) => Promise<boolean>;
} {
  const state = reactive<FamilyState>({
    family: null,
    availableMembers: [],
    loading: false,
    error: null,
  });

  const loadFamily = async (): Promise<void> => {
    try {
      state.loading = true;
      state.error = null;
      const families = await apiService.getFamilies();
      state.family = families.length > 0 ? families[0] : null;
    } catch (err) {
      state.error = err instanceof Error ? err.message : 'Failed to load family';
      debug.error('[useFamily] loadFamily error:', err);
    } finally {
      state.loading = false;
    }
  };

  const createFamily = async (name: string): Promise<boolean> => {
    try {
      state.error = null;
      state.family = await apiService.createFamily(name);
      return true;
    } catch (err) {
      state.error = err instanceof Error ? err.message : 'Failed to create family';
      debug.error('[useFamily] createFamily error:', err);
      return false;
    }
  };

  const renameFamily = async (name: string): Promise<boolean> => {
    if (!state.family) return false;
    try {
      state.error = null;
      state.family = await apiService.renameFamily(state.family.id, name);
      return true;
    } catch (err) {
      state.error = err instanceof Error ? err.message : 'Failed to rename family';
      debug.error('[useFamily] renameFamily error:', err);
      return false;
    }
  };

  const deleteFamily = async (): Promise<boolean> => {
    if (!state.family) return false;
    try {
      state.error = null;
      await apiService.deleteFamily(state.family.id);
      state.family = null;
      state.availableMembers = [];
      return true;
    } catch (err) {
      state.error = err instanceof Error ? err.message : 'Failed to delete family';
      debug.error('[useFamily] deleteFamily error:', err);
      return false;
    }
  };

  const loadAvailableMembers = async (): Promise<void> => {
    if (!state.family) return;
    try {
      state.availableMembers = await apiService.getAvailableMembers(state.family.id);
    } catch (err) {
      debug.error('[useFamily] loadAvailableMembers error:', err);
    }
  };

  const addMember = async (accountId: number): Promise<boolean> => {
    if (!state.family) return false;
    try {
      state.error = null;
      state.family = await apiService.addFamilyMember(state.family.id, accountId);
      await loadAvailableMembers();
      return true;
    } catch (err) {
      state.error = err instanceof Error ? err.message : 'Failed to add member';
      debug.error('[useFamily] addMember error:', err);
      return false;
    }
  };

  const removeMember = async (memberId: number): Promise<boolean> => {
    if (!state.family) return false;
    try {
      state.error = null;
      state.family = await apiService.removeFamilyMember(state.family.id, memberId);
      await loadAvailableMembers();
      return true;
    } catch (err) {
      state.error = err instanceof Error ? err.message : 'Failed to remove member';
      debug.error('[useFamily] removeMember error:', err);
      return false;
    }
  };

  return {
    state,
    loadFamily,
    createFamily,
    renameFamily,
    deleteFamily,
    loadAvailableMembers,
    addMember,
    removeMember,
  };
}
