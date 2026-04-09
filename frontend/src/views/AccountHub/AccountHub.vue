<template>
  <div class="page-view">
    <div class="hub-header-card">
      <AccountHubStats :total-value="totalValue" :cash-at-hand="cashAtHand" :isa-savings="isaSavings" :illiquid="illiquid" :trust-assets="trustAssets" :projected-annual-yield="projectedAnnualYield" :pension-breakdown="pensionBreakdown" :items="visibleItems" @create-account="openCreateAccountModal" @create-institution="openCreateInstitutionModal" @create-account-group="openCreateAccountGroupModal" />
    </div>
    <div v-if="state.error" class="hub-content-card p-6">
      <div class="error-banner"><span>{{ state.error }}</span><button class="btn-close" @click="clearError">×</button></div>
    </div>
    <div v-if="state.itemsLoading" class="hub-content-card p-8 loading-state">
      <div class="flex flex-col items-center"><div class="spinner"></div><p class="mt-4 text-muted">Loading portfolio...</p></div>
    </div>
    <div v-else-if="state.items.length === 0" class="hub-content-card p-8">
      <div class="text-center">
        <div class="empty-icon">📊</div><h2 class="empty-title">No accounts yet</h2>
        <p class="empty-text">Create your first account to get started</p>
        <button class="btn-add mt-4" @click="openCreateAccountModal">Create Account</button>
      </div>
    </div>
    <div v-else class="hub-content-card p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="section-title">Portfolio</h3>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium text-gray-700">Hide Closed</span>
            <button class="relative w-10 h-5 rounded-full transition-colors duration-200 border-none cursor-pointer" :class="hideClosed ? 'bg-blue-600' : 'bg-gray-300'" @click="hideClosed = !hideClosed" title="Toggle closed accounts">
              <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200" :class="hideClosed ? 'translate-x-5' : 'translate-x-0'" />
            </button>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium text-gray-700">Grouped</span>
            <button class="relative w-10 h-5 rounded-full transition-colors duration-200 border-none cursor-pointer" :class="grouped ? 'bg-blue-600' : 'bg-gray-300'" @click="grouped = !grouped" title="Toggle grouping">
              <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200" :class="grouped ? 'translate-x-5' : 'translate-x-0'" />
            </button>
          </div>
          <button class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white border-none rounded text-sm font-medium cursor-pointer transition-colors hover:bg-blue-600 active:bg-blue-700" @click="exportToExcel" title="Export accounts to Excel">
            <span class="export-icon">{{ Icons.download }}</span><span class="export-text">Excel</span>
          </button>
        </div>
      </div>
      <div class="table-wrap">
        <PortfolioTable
          :items="visibleItems" :groups="accountGroupsState.groups"
          :group-members="groupMembersMap" :account-types="accountTypes" :grouped="grouped"
          @edit-account="openEditAccountModal"
          @delete-account="(a) => openDeleteConfirm('account', a.id, a.name)"
          @show-events="(id, name, count, type) => openEventsModal(id, name, type)"
          @show-docs="openDocsModal"
          @edit-group="openEditAccountGroupModal" @delete-group="handleDeleteGroup"
          @update-balance="handleUpdateBalance"
        />
      </div>
    </div>
    <div v-if="state.institutionsLoading || state.institutions.length > 0" class="hub-content-card p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="section-title">Institutions</h3>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium text-gray-700">Group by Parent</span>
            <button class="relative w-10 h-5 rounded-full transition-colors duration-200 border-none cursor-pointer" :class="groupByParent ? 'bg-blue-600' : 'bg-gray-300'" @click="groupByParent = !groupByParent" title="Toggle grouping">
              <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200" :class="groupByParent ? 'translate-x-5' : 'translate-x-0'" />
            </button>
          </div>
          <button class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white border-none rounded text-sm font-medium cursor-pointer transition-colors hover:bg-blue-600 active:bg-blue-700" @click="exportInstitutions" title="Export institutions and credentials to Excel">
            <span class="export-icon">{{ Icons.download }}</span><span class="export-text">Excel</span>
          </button>
        </div>
      </div>
      <InstitutionsList
        v-if="!state.institutionsLoading" :institutions="state.institutions" :portfolio-items="state.items" :group-by-parent="groupByParent"
        @edit-institution="openEditInstitutionModal"
        @delete-institution="(id, name) => openDeleteConfirm('institution', id, name)"
        @manage-credentials="openCredentialsModal"
      />
    </div>
    <AccountDocumentsModal
      :open="docsModalOpen" :account-id="docsAccountId" :account-name="docsAccountName"
      @close="docsModalOpen = false" @uploaded="loadPortfolio" @deleted="loadPortfolio"
    />
    <AccountHubModals
      :editing-item="editingItem" :items="state.items" :institutions="state.institutions"
      :account-types="accountTypes" :account-statuses="accountStatuses" :institution-types="institutionTypes"
      :available-groups="accountGroupsState.groups" :group-members-map="groupMembersMap"
      :group-api-error="accountGroupsState.error" :account-error="state.error"
      :modal-type="modalType" :account-modal-open="accountModalOpen" :institution-modal-open="institutionModalOpen"
      :delete-confirm-open="deleteConfirmOpen" :delete-confirm-name="deleteConfirmName"
      :account-group-modal-open="accountGroupModalOpen" :account-group-modal-type="accountGroupModalType"
      :editing-group-id="editingGroupId" :editing-group-name="editingGroupName" :editing-group-member-ids="editingGroupMemberIds"
      :events-modal-open="eventsModalOpen" :events-title="eventsTitle" :events-loading="eventsLoading"
      :events-error="eventsError" :events="events" :account-type="accountType"
      :credential-modal-open="credentialModalOpen" :credential-institution="credentialInstitution"
      :credential-types="credentialTypes" :credentials="credentials" :credential-loading="credentialLoading"
      :credential-saving="credentialSaving" :credential-deleting-id="credentialDeletingId"
      :credential-error="credentialError" :editing-credential="editingCredential"
      @close-events="closeEventsModal" @add-win="handleAddWin" @close-account-group="closeAccountGroupModal"
      @save-account-group="handleAccountGroupSave" @delete-group-from-modal="handleDeleteGroupFromModal"
      @close-account="closeAccountModal" @save-account="handleAccountSave"
      @close-institution="closeInstitutionModal" @save-institution="handleInstitutionSave"
      @close-delete="closeDeleteConfirm" @confirm-delete="handleConfirmDelete"
      @close-credentials="closeCredentialsModal" @save-credential="handleCredentialSave"
      @edit-credential="handleCredentialEdit" @cancel-credential-edit="cancelCredentialEdit" @remove-credential="handleCredentialDelete"
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
import { useAccountGroupHandlers } from '@/composables/useAccountGroupHandlers';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import { calculatePensionValue, type PensionBreakdown } from '@composables/portfolioCalculations';
import AccountHubStats from '@views/AccountHub/AccountHubStats.vue';
import PortfolioTable from '@views/AccountHub/PortfolioTable.vue';
import InstitutionsList from '@views/AccountHub/InstitutionsList.vue';
import AccountHubModals from '@views/AccountHub/AccountHubModals.vue';
import AccountDocumentsModal from '@views/AccountHub/AccountDocumentsModal.vue';
import { apiService } from '@/services/ApiService';
import { institutionCredentialsService } from '@/services/InstitutionCredentialsService';
import { exportAccountsToExcel, exportInstitutionsToExcel } from '@/utils/exportToExcel';
import { useHubEventHandlers } from '@/composables/useHubEventHandlers';
import { Icons } from '@/constants/icons';

const { state, totalValue, cashAtHand, isaSavings, illiquid, trustAssets, projectedAnnualYield, loadPortfolio, clearError } = usePortfolio();
const hideClosed = ref(true);
const visibleItems = computed(() =>
  hideClosed.value ? state.items.filter((i) => !i.account.closedAt) : state.items
);
const { state: accountGroupsState, loadGroups, createGroup, updateGroup, deleteGroup, saveGroupMembers } = useAccountGroups();
const grouped = ref(true); const groupByParent = ref(true);
const lifeExpectancy = ref(36); const annuityRate = ref(0.075);
const pensionBreakdown = computed<PensionBreakdown>(() => calculatePensionValue(state.items, lifeExpectancy.value, annuityRate.value));
const accountTypes = ref<ReferenceDataItem[]>([]); const accountStatuses = ref<ReferenceDataItem[]>([]);
const institutionTypes = ref<ReferenceDataItem[]>([]); const credentialTypes = ref<any[]>([]);
onMounted(() => {
  void loadPortfolio(); void loadGroups();
  void Promise.all([
    apiService.getReferenceData('account_type'), apiService.getReferenceData('account_status'),
    apiService.getReferenceData('institution_type'), apiService.getReferenceData('credential_type'),
    apiService.getReferenceData('life_expectancy'), apiService.getReferenceData('annuity_assumption_rate'),
  ]).then(([types, statuses, instTypes, credTypes, lifeExpData, annuityData]) => {
    accountTypes.value = types; accountStatuses.value = statuses;
    institutionTypes.value = instTypes; credentialTypes.value = credTypes;
    if (lifeExpData[0]?.referenceValue) lifeExpectancy.value = parseFloat(lifeExpData[0].referenceValue);
    if (annuityData[0]?.referenceValue) annuityRate.value = parseFloat(annuityData[0].referenceValue);
  });
});

const {
  credentialModalOpen, credentialInstitution, credentials, credentialLoading, credentialSaving,
  credentialDeletingId, credentialError, editingCredential, openCredentialsModal, closeCredentialsModal,
  handleCredentialSave, handleCredentialEdit, cancelCredentialEdit, handleCredentialDelete,
} = useCredentialsModal();
const { eventsModalOpen, eventsTitle, eventsLoading, eventsError, events, accountType, currentAccountId, openEventsModal, closeEventsModal } = useEventsModal();
const accountModalOpen = ref(false);
const institutionModalOpen = ref(false);
const modalType = ref<'create' | 'edit'>('create');
const editingItem = ref<Account | Institution | null>(null);
const deleteConfirmOpen = ref(false);
const deleteConfirmType = ref<'account' | 'institution'>('account');
const deleteConfirmId = ref(0); const deleteConfirmName = ref('');
const groupMembersMap = computed(() => accountGroupsState.groupMembers);
const {
  accountGroupModalOpen, accountGroupModalType, editingGroupId, editingGroupName, editingGroupMemberIds,
  openCreateAccountGroupModal, openEditAccountGroupModal, closeAccountGroupModal,
  handleAccountGroupSave, handleDeleteGroup, handleDeleteGroupFromModal,
} = useAccountGroupHandlers(groupMembersMap, loadGroups, createGroup, updateGroup, deleteGroup, saveGroupMembers);
const openCreateAccountModal = (): void => { modalType.value = 'create'; editingItem.value = null; accountModalOpen.value = true; };
const openEditAccountModal = (account: Account): void => { modalType.value = 'edit'; editingItem.value = account; accountModalOpen.value = true; };
const closeAccountModal = (): void => { accountModalOpen.value = false; editingItem.value = null; };
const openCreateInstitutionModal = (): void => { modalType.value = 'create'; editingItem.value = null; institutionModalOpen.value = true; };
const openEditInstitutionModal = (inst: Institution): void => { modalType.value = 'edit'; editingItem.value = inst; institutionModalOpen.value = true; };
const closeInstitutionModal = (): void => { institutionModalOpen.value = false; editingItem.value = null; };
const openDeleteConfirm = (type: 'account' | 'institution', id: number, name: string): void => { deleteConfirmType.value = type; deleteConfirmId.value = id; deleteConfirmName.value = name; deleteConfirmOpen.value = true; };
const closeDeleteConfirm = (): void => { deleteConfirmOpen.value = false };
const exportToExcel = (): void => { exportAccountsToExcel(state.items, `wealthtrack-accounts-${new Date().toISOString().split('T')[0]}.xlsx`); };
const exportInstitutions = (): void => { void exportInstitutionsToExcel(state.institutions, (id) => institutionCredentialsService.listCredentials(id), `wealthtrack-institutions-${new Date().toISOString().split('T')[0]}.xlsx`); };
const { handleSave: handleAccountCrudSave, handleDelete: handleAccountDelete } = useAccountCrudHandlers(accountTypes, accountStatuses, modalType, editingItem, closeAccountModal);
const { handleSave: handleInstitutionCrudSave, handleDelete: handleInstitutionDelete } = useInstitutionCrudHandlers(modalType, editingItem, closeInstitutionModal);
const handleAccountSave = async (payload: any): Promise<void> => {
  try { await handleAccountCrudSave(payload); await loadPortfolio(); closeAccountModal(); }
  catch (error) { debug.error('[AccountHub] Account save failed:', error); }
};
const handleInstitutionSave = async (payload: any): Promise<void> => {
  try { await handleInstitutionCrudSave(payload); await loadPortfolio(); closeInstitutionModal(); }
  catch (error) { debug.error('[AccountHub] Institution save failed:', error); }
};
const handleConfirmDelete = async (): Promise<void> => {
  try {
    if (deleteConfirmType.value === 'account') await handleAccountDelete(deleteConfirmId.value);
    else await handleInstitutionDelete(deleteConfirmId.value);
    await loadPortfolio();
  } catch (e) { state.error = e instanceof Error ? e.message : 'Failed to delete'; } finally { closeDeleteConfirm(); }
};
const { handleUpdateBalance, handleAddWin } = useHubEventHandlers(state, loadPortfolio, currentAccountId, accountType, openEventsModal);
const docsModalOpen = ref(false); const docsAccountId = ref(0); const docsAccountName = ref('');
const openDocsModal = (id: number, name: string): void => { docsAccountId.value = id; docsAccountName.value = name; docsModalOpen.value = true; };
</script>
