/**
 * Composable for account group modal handlers in AccountHub.
 */
import { ref, type Ref } from 'vue';
import { debug } from '@/utils/debug';
import type { AccountGroup } from '@/models/WealthTrackDataModels';

type CreateGroupFn = (name: string) => Promise<AccountGroup | null>;
type UpdateGroupFn = (id: number, name: string) => Promise<AccountGroup | null>;
type DeleteGroupFn = (id: number) => Promise<boolean>;
type SaveMembersFn = (groupId: number, accountIds: number[], existing: number[]) => Promise<boolean>;

export function useAccountGroupHandlers(
  groupMembersMap: Ref<Map<number, number[]>>,
  loadGroups: () => Promise<void>,
  createGroup: CreateGroupFn,
  updateGroup: UpdateGroupFn,
  deleteGroup: DeleteGroupFn,
  saveGroupMembers: SaveMembersFn,
): {
  accountGroupModalOpen: Ref<boolean>;
  accountGroupModalType: Ref<'create' | 'edit'>;
  editingGroupId: Ref<number>;
  editingGroupName: Ref<string>;
  editingGroupMemberIds: Ref<number[]>;
  openCreateAccountGroupModal: () => void;
  openEditAccountGroupModal: (groupId: number, groupName: string) => void;
  closeAccountGroupModal: () => void;
  handleAccountGroupSave: (data: { name: string; accountIds: number[]; groupId?: number }) => Promise<void>;
  handleDeleteGroup: (groupId: number) => Promise<void>;
  handleDeleteGroupFromModal: (groupId: number) => Promise<void>;
} {
  const accountGroupModalOpen = ref(false);
  const accountGroupModalType = ref<'create' | 'edit'>('create');
  const editingGroupId = ref(0);
  const editingGroupName = ref('');
  const editingGroupMemberIds = ref<number[]>([]);

  const openCreateAccountGroupModal = (): void => {
    accountGroupModalType.value = 'create';
    editingGroupId.value = 0;
    editingGroupName.value = '';
    editingGroupMemberIds.value = [];
    accountGroupModalOpen.value = true;
  };

  const openEditAccountGroupModal = (groupId: number, groupName: string): void => {
    accountGroupModalType.value = 'edit';
    editingGroupId.value = groupId;
    editingGroupName.value = groupName;
    editingGroupMemberIds.value = groupMembersMap.value.get(groupId) || [];
    accountGroupModalOpen.value = true;
  };

  const closeAccountGroupModal = (): void => { accountGroupModalOpen.value = false; };

  const handleAccountGroupSave = async (data: { name: string; accountIds: number[]; groupId?: number }): Promise<void> => {
    try {
      const isEditingExisting = accountGroupModalType.value === 'edit' || !!data.groupId;
      const targetGroupId = data.groupId || editingGroupId.value;
      if (isEditingExisting) {
        const groupUpdated = await updateGroup(targetGroupId, data.name);
        if (!groupUpdated) return;
        const existingMembers = groupMembersMap.value.get(targetGroupId) || [];
        const membersSaved = await saveGroupMembers(targetGroupId, data.accountIds, existingMembers);
        if (!membersSaved) return;
      } else {
        const group = await createGroup(data.name);
        if (!group) return;
        const membersSaved = await saveGroupMembers(group.id, data.accountIds, []);
        if (!membersSaved) return;
      }
      await loadGroups();
      closeAccountGroupModal();
    } catch (error) {
      debug.error('[AccountHub] Save group error:', error);
    }
  };

  const handleDeleteGroup = async (groupId: number): Promise<void> => {
    if (confirm('Are you sure you want to delete this group?')) {
      await deleteGroup(groupId);
      await loadGroups();
    }
  };

  const handleDeleteGroupFromModal = async (groupId: number): Promise<void> => {
    if (confirm('Are you sure you want to delete this group?')) {
      await deleteGroup(groupId);
      await loadGroups();
    }
  };

  return {
    accountGroupModalOpen, accountGroupModalType,
    editingGroupId, editingGroupName, editingGroupMemberIds,
    openCreateAccountGroupModal, openEditAccountGroupModal, closeAccountGroupModal,
    handleAccountGroupSave, handleDeleteGroup, handleDeleteGroupFromModal,
  };
}
