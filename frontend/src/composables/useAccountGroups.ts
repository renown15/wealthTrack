/**
 * Composable for managing account groups
 */

import { computed, reactive } from 'vue';
import { apiService } from '@/services/ApiService';
import { debug } from '@/utils/debug';
import type { AccountGroup, AccountGroupCreateRequest, AccountGroupUpdateRequest } from '@/models/WealthTrackDataModels';

export interface AccountGroupsState {
  groups: AccountGroup[];
  groupMembers: Map<number, number[]>; // groupId -> accountIds
  loading: boolean;
  error: string | null;
}

export function useAccountGroups(): {
  state: AccountGroupsState;
  loadGroups: () => Promise<void>;
  createGroup: (name: string) => Promise<AccountGroup | null>;
  updateGroup: (groupId: number, name: string) => Promise<AccountGroup | null>;
  deleteGroup: (groupId: number) => Promise<boolean>;
  addAccountToGroup: (groupId: number, accountId: number) => Promise<boolean>;
  removeAccountFromGroup: (groupId: number, accountId: number) => Promise<boolean>;
  saveGroupMembers: (groupId: number, accountIds: number[], existingMembers: number[]) => Promise<boolean>;
  groupById: (id: number) => import('vue').ComputedRef<AccountGroup | undefined>;
} {
  const state = reactive<AccountGroupsState>({
    groups: [],
    groupMembers: new Map(),
    loading: false,
    error: null,
  });

  const loadGroups = async (): Promise<void> => {
    try {
      state.loading = true;
      state.error = null;
      const groups = await apiService.getAccountGroups();
      state.groups = groups || [];
      
      // Load members for each group
      state.groupMembers.clear();
      for (const group of state.groups) {
        try {
          const memberIds = await apiService.getGroupMembers(group.id);
          state.groupMembers.set(group.id, memberIds || []);
        } catch (error) {
          // If members endpoint doesn't exist, set empty
          state.groupMembers.set(group.id, []);
        }
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to load account groups';
      debug.error('[useAccountGroups] Load error:', error);
    } finally {
      state.loading = false;
    }
  };

  const createGroup = async (name: string): Promise<AccountGroup | null> => {
    try {
      state.error = null;
      const payload: AccountGroupCreateRequest = { name };
      const group = await apiService.createAccountGroup(payload);
      if (group) {
        state.groups = [...state.groups, group];
      }
      return group || null;
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to create account group';
      debug.error('[useAccountGroups] Create error:', error);
      return null;
    }
  };

  const updateGroup = async (groupId: number, name: string): Promise<AccountGroup | null> => {
    try {
      state.error = null;
      const payload: AccountGroupUpdateRequest = { name };
      const group = await apiService.updateAccountGroup(groupId, payload);
      if (group) {
        state.groups = state.groups.map(g => g.id === groupId ? group : g);
      }
      return group || null;
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to update account group';
      debug.error('[useAccountGroups] Update error:', error);
      return null;
    }
  };

  const deleteGroup = async (groupId: number): Promise<boolean> => {
    try {
      state.error = null;
      await apiService.deleteAccountGroup(groupId);
      state.groups = state.groups.filter(g => g.id !== groupId);
      return true;
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to delete account group';
      debug.error('[useAccountGroups] Delete error:', error);
      return false;
    }
  };

  const addAccountToGroup = async (groupId: number, accountId: number): Promise<boolean> => {
    try {
      state.error = null;
      await apiService.addAccountToGroup(groupId, accountId);
      return true;
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to add account to group';
      debug.error('[useAccountGroups] Add member error:', error);
      return false;
    }
  };

  const removeAccountFromGroup = async (groupId: number, accountId: number): Promise<boolean> => {
    try {
      state.error = null;
      await apiService.removeAccountFromGroup(groupId, accountId);
      return true;
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to remove account from group';
      debug.error('[useAccountGroups] Remove member error:', error);
      return false;
    }
  };

  const saveGroupMembers = async (
    groupId: number,
    accountIds: number[],
    existingMembers: number[],
  ): Promise<boolean> => {
    try {
      state.error = null;
      
      // Add new members
      const toAdd = accountIds.filter(id => !existingMembers.includes(id));
      for (const accountId of toAdd) {
        await addAccountToGroup(groupId, accountId);
      }
      
      // Remove deleted members
      const toRemove = existingMembers.filter(id => !accountIds.includes(id));
      for (const accountId of toRemove) {
        await removeAccountFromGroup(groupId, accountId);
      }
      
      return true;
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to save group members';
      debug.error('[useAccountGroups] Save members error:', error);
      return false;
    }
  };

  const groupById = (id: number): import('vue').ComputedRef<AccountGroup | undefined> => computed(() => state.groups.find(g => g.id === id));

  return {
    state,
    loadGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    addAccountToGroup,
    removeAccountFromGroup,
    saveGroupMembers,
    groupById,
  };
}
