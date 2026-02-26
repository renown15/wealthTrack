<template>
  <div class="page-view">
    <div class="hub-header-card">
      <AccountHubStats
        :total-value="totalValue" :account-count="accountCount"
        :cash-at-hand="cashAtHand" :isa-savings="isaSavings" :illiquid="illiquid" :trust-assets="trustAssets"
        :institution-count="institutionCount" :event-count="eventCount"
        :projected-annual-yield="projectedAnnualYield"
        @create-account="openCreateAccountModal" @create-institution="openCreateInstitutionModal"
        @create-account-group="openCreateAccountGroupModal"
      />
    </div>
    <div v-if="state.error" class="hub-content-card p-6">
      <div class="error-banner">
        <span>{{ state.error }}</span>
        <button class="btn-close" @click="clearError">×</button>
      </div>
    </div>
    <div v-if="state.itemsLoading" class="hub-content-card p-8 loading-state">
      <div class="flex flex-col items-center">
        <div class="spinner"></div>
        <p class="mt-4 text-muted">Loading portfolio...</p>
      </div>
    </div>
    <div v-else-if="accountCount === 0" class="hub-content-card p-8">
      <div class="text-center">
        <div class="empty-icon">📊</div>
        <h2 class="empty-title">No accounts yet</h2>
        <p class="empty-text">Create your first account to get started</p>
        <button class="btn-add mt-4" @click="openCreateAccountModal">Create Account</button>
      </div>
    </div>
    <div v-else class="hub-content-card p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="section-title">Portfolio (Grouped)</h3>
        <button class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white border-none rounded text-sm font-medium cursor-pointer transition-colors hover:bg-blue-600 active:bg-blue-700" @click="exportToExcel" title="Export accounts to Excel">
          <span class="export-icon">⬇</span>
          <span class="export-text">Excel</span>
        </button>
      </div>
      <div class="table-wrap">
        <PortfolioTable
          :items="state.items"
          :groups="accountGroupsState.groups"
          :group-members="groupMembersMap"
          :account-types="accountTypes"
          @edit-account="openEditAccountModal"
          @delete-account="(account) => openDeleteConfirm('account', account.id, account.name)"
          @show-events="openEventsModal"
          @edit-group="openEditAccountGroupModal"
          @delete-group="handleDeleteGroup"
          @update-balance="handleUpdateBalance"
        />
      </div>
    </div>
    <div v-if="state.institutionsLoading || state.institutions.length > 0" class="hub-content-card p-6">
      <h3 class="section-title">Institutions</h3>
      <div v-if="state.institutionsLoading" class="loading-state py-8">
        <div class="flex flex-col items-center">
          <div class="spinner"></div>
          <p class="mt-4 text-muted">Loading institutions...</p>
        </div>
      </div>
      <InstitutionsList
        v-else
        :institutions="state.institutions" :portfolio-items="state.items"
        @edit-institution="openEditInstitutionModal"
        @delete-institution="(id, name) => openDeleteConfirm('institution', id, name)"
        @manage-credentials="openCredentialsModal"
      />
    </div>
    <AccountEventsModal
      :open="eventsModalOpen" :title="eventsTitle" :events="events"
      :loading="eventsLoading" :error="eventsError" @close="closeEventsModal"
    />
    <AccountGroupModal
      :open="accountGroupModalOpen"
      :type="accountGroupModalType"
      :items="state.items"
      :account-types="accountTypes"
      :available-groups="accountGroupsState.groups"
      :group-members-map="groupMembersMap"
      :api-error="accountGroupsState.error"
      :initial-group-name="editingGroupName"
      :initial-group-id="editingGroupId"
      :initial-member-ids="editingGroupMemberIds"
      @close="closeAccountGroupModal"
      @save="handleAccountGroupSave"
      @delete-group="handleDeleteGroupFromModal"
    />
    <AccountModal
      :open="accountModalOpen" :type="modalType"
      :institutions="state.institutions" :account-types="accountTypes"
      :account-statuses="accountStatuses"
      :initial-name="initialModalName" :initial-institution-id="initialModalInstitutionId"
      :initial-type-id="initialModalTypeId" :initial-status-id="initialModalStatusId"
      :initial-opened-at="initialModalOpenedAt" :initial-closed-at="initialModalClosedAt"
      :initial-account-number="initialModalAccountNumber" :initial-sort-code="initialModalSortCode"
      :initial-roll-ref-number="initialModalRollRefNumber" :initial-interest-rate="initialModalInterestRate"
      :initial-fixed-bonus-rate="initialModalFixedBonusRate"
      :initial-fixed-bonus-rate-end-date="initialModalFixedBonusRateEndDate"
      :initial-release-date="initialModalReleaseDate"
      :initial-number-of-shares="initialModalNumberOfShares"
      :initial-underlying="initialModalUnderlying"
      :initial-price="initialModalPrice"
      :initial-purchase-price="initialModalPurchasePrice"
      :error="state.error"
      @close="closeAccountModal" @save="handleAccountSave"
    />
    <InstitutionModal
      :open="institutionModalOpen" :type="modalType"
      :institutions="state.institutions" :institution-types="institutionTypes"
      :initial-name="initialModalName" :initial-parent-id="initialModalParentId"
      :initial-institution-type="initialModalInstitutionType"
      :error="state.error"
      @close="closeInstitutionModal" @save="handleInstitutionSave"
    />
    <DeleteConfirmModal
      :open="deleteConfirmOpen" :item-name="deleteConfirmName"
      @close="closeDeleteConfirm" @confirm="handleConfirmDelete"
    />
    <InstitutionCredentialsModal
      :open="credentialModalOpen" :institution="credentialInstitution"
      :credential-types="credentialTypes" :credentials="credentials"
      :loading="credentialLoading" :saving="credentialSaving"
      :deleting-id="credentialDeletingId" :error="credentialError"
      :editing-credential="editingCredential" @close="closeCredentialsModal"
      @save="handleCredentialSave" @edit="handleCredentialEdit"
      @cancel-edit="cancelCredentialEdit" @remove="handleCredentialDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { Account, Institution } from '@/models/WealthTrackDataModels';
import { usePortfolio } from '@/composables/usePortfolio';
import { useAccountGroups } from '@/composables/useAccountGroups';
import { useCredentialsModal } from '@/composables/useCredentialsModal';
import { useEventsModal } from '@/composables/useEventsModal';
import { debug } from '@/utils/debug';
import { useAccountCrudHandlers } from '@/composables/useAccountCrudHandlers';
import { useInstitutionCrudHandlers } from '@/composables/useInstitutionCrudHandlers';
import type { ReferenceDataItem } from '@/models/ReferenceData';

import AccountHubStats from '@views/AccountHub/AccountHubStats.vue';
import PortfolioTable from '@views/AccountHub/PortfolioTable.vue';
import AccountGroupModal from '@views/AccountHub/AccountGroupModal.vue';
import AccountModal from '@views/AccountHub/AccountModal.vue';
import InstitutionModal from '@views/AccountHub/InstitutionModal.vue';
import DeleteConfirmModal from '@views/AccountHub/DeleteConfirmModal.vue';
import InstitutionsList from '@views/AccountHub/InstitutionsList.vue';
import AccountEventsModal from '@views/AccountHub/AccountEventsModal.vue';
import InstitutionCredentialsModal from '@views/AccountHub/InstitutionCredentialsModal.vue';

import { apiService } from '@/services/ApiService';
import { exportAccountsToExcel } from '@/utils/exportToExcel';

const { state, totalValue, accountCount, institutionCount, eventCount, cashAtHand, isaSavings, illiquid, trustAssets, projectedAnnualYield, loadPortfolio, clearError } = usePortfolio();
const { state: accountGroupsState, loadGroups, createGroup, updateGroup, deleteGroup, saveGroupMembers } = useAccountGroups();

onMounted(() => {
  void loadPortfolio();
  void loadGroups();
  void Promise.all([
    apiService.getReferenceData('account_type'),
    apiService.getReferenceData('account_status'),
    apiService.getReferenceData('institution_type'),
    apiService.getReferenceData('credential_type'),
  ]).then(([types, statuses, institutionTypesData, credentialTypesData]) => {
    accountTypes.value = types;
    accountStatuses.value = statuses;
    institutionTypes.value = institutionTypesData;
    credentialTypes.value = credentialTypesData;
  });
});

const {
  credentialModalOpen,
  credentialInstitution,
  credentials,
  credentialLoading,
  credentialSaving,
  credentialDeletingId,
  credentialError,
  editingCredential,
  openCredentialsModal,
  closeCredentialsModal,
  handleCredentialSave,
  handleCredentialEdit,
  cancelCredentialEdit,
  handleCredentialDelete,
} = useCredentialsModal();

const {
  eventsModalOpen,
  eventsTitle,
  eventsLoading,
  eventsError,
  events,
  openEventsModal,
  closeEventsModal,
} = useEventsModal();

// Modal state
const accountModalOpen = ref(false);
const institutionModalOpen = ref(false);
const modalType = ref<'create' | 'edit'>('create');
const editingItem = ref<Account | Institution | null>(null);

// Delete confirm modal state
const deleteConfirmOpen = ref(false);
const deleteConfirmType = ref<'account' | 'institution'>('account');
const deleteConfirmId = ref(0);
const deleteConfirmName = ref('');

// Account group modal state
const accountGroupModalOpen = ref(false);
const accountGroupModalType = ref<'create' | 'edit'>('create');
const editingGroupId = ref(0);
const editingGroupName = ref('');
const editingGroupMemberIds = ref<number[]>([]);

// Initial values for modals
const initialModalName = computed(() => editingItem.value?.name ?? '');
const initialModalInstitutionId = computed(() =>
  editingItem.value && 'institutionId' in editingItem.value
    ? editingItem.value.institutionId : 0);
const initialModalTypeId = computed(() =>
  editingItem.value && 'typeId' in editingItem.value
    ? editingItem.value.typeId : 0);
const initialModalStatusId = computed(() =>
  editingItem.value && 'statusId' in editingItem.value
    ? editingItem.value.statusId : 0);
const initialModalOpenedAt = computed(() =>
  editingItem.value && 'openedAt' in editingItem.value
    ? (editingItem.value as Account).openedAt : null);
const initialModalClosedAt = computed(() =>
  editingItem.value && 'closedAt' in editingItem.value
    ? (editingItem.value as Account).closedAt : null);
const initialModalAccountNumber = computed(() =>
  editingItem.value && 'accountNumber' in editingItem.value
    ? (editingItem.value as Account).accountNumber : null);
const initialModalSortCode = computed(() =>
  editingItem.value && 'sortCode' in editingItem.value
    ? (editingItem.value as Account).sortCode : null);
const initialModalRollRefNumber = computed(() =>
  editingItem.value && 'rollRefNumber' in editingItem.value
    ? (editingItem.value as Account).rollRefNumber : null);
const initialModalInterestRate = computed(() =>
  editingItem.value && 'interestRate' in editingItem.value
    ? (editingItem.value as Account).interestRate : null);
const initialModalFixedBonusRate = computed(() =>
  editingItem.value && 'fixedBonusRate' in editingItem.value
    ? (editingItem.value as Account).fixedBonusRate : null);
const initialModalFixedBonusRateEndDate = computed(() =>
  editingItem.value && 'fixedBonusRateEndDate' in editingItem.value
    ? (editingItem.value as Account).fixedBonusRateEndDate : null);
const initialModalReleaseDate = computed(() =>
  editingItem.value && 'releaseDate' in editingItem.value
    ? (editingItem.value as Account).releaseDate : null);
const initialModalNumberOfShares = computed(() =>
  editingItem.value && 'numberOfShares' in editingItem.value
    ? (editingItem.value as Account).numberOfShares : null);
const initialModalUnderlying = computed(() =>
  editingItem.value && 'underlying' in editingItem.value
    ? (editingItem.value as Account).underlying : null);
const initialModalPrice = computed(() =>
  editingItem.value && 'price' in editingItem.value
    ? (editingItem.value as Account).price : null);
const initialModalPurchasePrice = computed(() =>
  editingItem.value && 'purchasePrice' in editingItem.value
    ? (editingItem.value as Account).purchasePrice : null);
const initialModalParentId = computed(() =>
  editingItem.value && 'parentId' in editingItem.value
    ? (editingItem.value as Institution).parentId : null);
const initialModalInstitutionType = computed(() =>
  editingItem.value && 'institutionType' in editingItem.value
    ? (editingItem.value as Institution).institutionType : null);

// Account modal handlers
const openCreateAccountModal = (): void => {
  modalType.value = 'create';
  editingItem.value = null;
  accountModalOpen.value = true;
};

const openEditAccountModal = (account: Account): void => {
  modalType.value = 'edit';
  editingItem.value = account;
  accountModalOpen.value = true;
};

const closeAccountModal = (): void => {
  accountModalOpen.value = false;
  editingItem.value = null;
};

// Institution modal handlers
const openCreateInstitutionModal = (): void => {
  modalType.value = 'create';
  editingItem.value = null;
  institutionModalOpen.value = true;
};

const openEditInstitutionModal = (institution: Institution): void => {
  modalType.value = 'edit';
  editingItem.value = institution;
  institutionModalOpen.value = true;
};

const closeInstitutionModal = (): void => {
  institutionModalOpen.value = false;
  editingItem.value = null;
};

// Delete confirm modal handlers
const openDeleteConfirm = (
  type: 'account' | 'institution',
  id: number,
  name: string,
): void => {
  deleteConfirmType.value = type;
  deleteConfirmId.value = id;
  deleteConfirmName.value = name;
  deleteConfirmOpen.value = true;
};

const closeDeleteConfirm = (): void => {
  deleteConfirmOpen.value = false;
};

// Account group modal handlers
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
  // Get member IDs for this group from API or state
  editingGroupMemberIds.value = groupMembersMap.value.get(groupId) || [];
  accountGroupModalOpen.value = true;
};

const closeAccountGroupModal = (): void => {
  accountGroupModalOpen.value = false;
};

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

// Compute group members map
const groupMembersMap = computed(() => {
  return accountGroupsState.groupMembers;
});

// Account and institution CRUD handlers
const accountTypes = ref<ReferenceDataItem[]>([]);
const accountStatuses = ref<ReferenceDataItem[]>([]);
const institutionTypes = ref<ReferenceDataItem[]>([]);

const {
  handleSave: handleAccountCrudSave,
  handleDelete: handleAccountDelete,
} = useAccountCrudHandlers(accountTypes, accountStatuses, modalType, editingItem, closeAccountModal);

const {
  handleSave: handleInstitutionCrudSave,
  handleDelete: handleInstitutionDelete,
} = useInstitutionCrudHandlers(modalType, editingItem, closeInstitutionModal);

// Account modal save handler
const handleAccountSave = async (payload: any): Promise<void> => {
  try {
    await handleAccountCrudSave(payload);
    await loadPortfolio();
    closeAccountModal();
  } catch (error) {
    // Error is already in state.error from handleAccountCrudSave
    console.error('[AccountHub] Account save failed:', error);
  }
};

// Institution modal save handler
const handleInstitutionSave = async (payload: any): Promise<void> => {
  try {
    await handleInstitutionCrudSave(payload);
    await loadPortfolio();
    closeInstitutionModal();
  } catch (error) {
    // Error is already in state.error from handleInstitutionCrudSave
    console.error('[AccountHub] Institution save failed:', error);
  }
};

const handleConfirmDelete = async (): Promise<void> => {
  if (deleteConfirmType.value === 'account') {
    await handleAccountDelete(deleteConfirmId.value);
  } else {
    await handleInstitutionDelete(deleteConfirmId.value);
  }
  // Ensure table reloads with updated data after delete
  await loadPortfolio();
  closeDeleteConfirm();
};

const handleShowEvents = async (accountId: number, accountName: string): Promise<void> => {
  await openEventsModal(accountId, accountName);
};

const handleUpdateBalance = async (accountId: number, value: string): Promise<void> => {
  try {
    let balanceValue = parseFloat(value);
    if (Number.isNaN(balanceValue)) {
      state.error = 'Invalid balance value';
      return;
    }
    // Optimistically update the item in place — no full reload needed
    const item = state.items.find(i => i.account.id === accountId);
    await apiService.createAccountEvent(accountId, {
      event_type: 'Balance',
      value: balanceValue.toString(),
    });
    if (item) {
      const now = new Date().toISOString();
      item.latestBalance = {
        id: item.latestBalance?.id ?? 0,
        accountId,
        userId: item.latestBalance?.userId ?? 0,
        eventType: 'Balance',
        value: balanceValue.toString(),
        createdAt: now,
        updatedAt: now,
      };
    }
  } catch (error) {
    state.error = error instanceof Error ? error.message : 'Failed to update balance';
  }
};

const exportToExcel = (): void => {
  const fileName = `wealthtrack-accounts-${new Date().toISOString().split('T')[0]}.xlsx`;
  exportAccountsToExcel(state.items, fileName);
};

const credentialTypes = ref<any[]>([]);
</script>

