<template>
  <div class="page-view">
    <div class="hub-header-card">
      <AccountHubStats :total-value="totalValue" :cash-at-hand="cashAtHand" :isa-savings="isaSavings" :illiquid="illiquid" :trust-assets="trustAssets" :projected-annual-yield="projectedAnnualYield" :pension-breakdown="pensionBreakdown" :items="visibleItems" :last-price-update="lastPriceUpdate" @create-account="openCreateAccountModal" @create-institution="openCreateInstitutionModal" @create-account-group="openCreateAccountGroupModal" />
    </div>
    <div v-if="state.error" class="hub-content-card p-6">
      <div class="error-banner"><span>{{ state.error }}</span><button class="btn-close" @click="clearError">×</button></div>
    </div>
    <div v-if="state.itemsLoading && activeMemberId === null" class="hub-content-card p-8 loading-state">
      <div class="flex flex-col items-center"><div class="spinner"></div><p class="mt-4 text-muted">Loading portfolio...</p></div>
    </div>
    <div v-else-if="state.items.length === 0 && activeMemberId === null" class="hub-content-card p-8">
      <div class="text-center">
        <div class="empty-icon">📊</div><h2 class="empty-title">No accounts yet</h2>
        <p class="empty-text">Create your first account to get started</p>
        <button class="btn-add mt-4" @click="openCreateAccountModal">Create Account</button>
      </div>
    </div>
    <div v-else class="hub-content-card p-3 sm:p-6">
      <FamilyMemberTabs v-if="otherMembers.length > 0" :members="otherMembers" :active-id="activeMemberId" @select="selectMember" />
      <div v-if="isLoadingMember" class="py-8 text-center text-sm text-muted">Loading portfolio…</div>
      <div v-else-if="memberError" class="error-banner mb-3"><span>{{ memberError }}</span></div>
      <template v-else>
        <PortfolioControls :hide-closed="hideClosed" :grouped="grouped" :refreshing="priceRefreshing" @toggle-hide-closed="hideClosed = !hideClosed" @toggle-grouped="grouped = !grouped" @export="handleExport" @refresh-prices="handleRefreshPrices" />
        <div class="table-wrap">
          <PortfolioTable
            :items="visibleItems" :groups="portfolioGroups" :read-only="activeMemberId !== null"
            :group-members="groupMembersMap" :account-types="accountTypes" :grouped="grouped"
            @edit-account="(a) => activeMemberId === null && openEditAccountModal(a)"
            @delete-account="(a) => activeMemberId === null && openDeleteConfirm('account', a.id, a.name)"
            @show-events="(id, name, _count, type) => activeMemberId === null && openEventsModal(id, name, type)"
            @show-docs="(id, name) => activeMemberId === null && openDocsModal(id, name)"
            @edit-group="(id, name) => activeMemberId === null && openEditAccountGroupModal(id, name)"
            @delete-group="(g) => activeMemberId === null && handleDeleteGroup(g)"
            @update-balance="handleBalanceUpdate"
          />
        </div>
        <InstitutionsPanel
          :institutions="institutionsToShow"
          :portfolio-items="visibleItems"
          :all-members="allMembers"
          :group-by-parent="groupByParent"
          :loading="activeMemberId === null && state.institutionsLoading"
          :read-only="activeMemberId !== null"
          :is-all-tab="activeMemberId === 'all'"
          @toggle-group-by-parent="groupByParent = !groupByParent"
          @export="exportInstitutions"
          @edit-institution="openEditInstitutionModal"
          @delete-institution="(id, name) => openDeleteConfirm('institution', id, name)"
          @manage-credentials="openCredentialsModal"
        />
      </template>
    </div>
    <AccountDocumentsModal
      :open="docsModalOpen" :account-id="docsAccountId" :account-name="docsAccountName"
      @close="docsModalOpen = false" @uploaded="loadPortfolio" @deleted="loadPortfolio"
    />
    <AccountHubModals
      :editing-item="editingItem" :items="state.items" :institutions="state.institutions"
      :account-types="accountTypes" :account-statuses="accountStatuses" :institution-types="institutionTypes"
      :available-groups="portfolioGroups" :group-members-map="groupMembersMap"
      :group-api-error="accountGroupsState.error" :account-error="state.error"
      :modal-type="modalType" :account-modal-open="accountModalOpen" :institution-modal-open="institutionModalOpen"
      :delete-confirm-open="deleteConfirmOpen" :delete-confirm-name="deleteConfirmName"
      :account-group-modal-open="accountGroupModalOpen" :account-group-modal-type="accountGroupModalType"
      :editing-group-id="editingGroupId" :editing-group-name="editingGroupName" :editing-group-member-ids="editingGroupMemberIds"
      :events-modal-open="eventsModalOpen" :events-title="eventsTitle" :events-loading="eventsLoading"
      :events-error="eventsError" :events="events" :account-type="accountType"
      :share-sale-modal-open="shareSaleModalOpen" :shares-account-id="currentAccountId" :share-sale-start-tab="shareSaleStartTab"
      :credential-modal-open="credentialModalOpen" :credential-institution="credentialInstitution"
      :credential-types="credentialTypes" :credentials="credentials" :credential-loading="credentialLoading"
      :credential-saving="credentialSaving" :credential-deleting-id="credentialDeletingId"
      :credential-error="credentialError" :editing-credential="editingCredential"
      @close-events="closeEventsModal" @add-win="handleAddWin" @record-sale="openShareSaleModal" @view-sales="openShareSaleModalHistory" @save-dividend="handleSaveDividend" @save-gift="handleSaveGift"
      @close-share-sale="closeShareSaleModal" @share-sold="handleShareSold" @delete-gift="handleDeleteGift"
      @close-account-group="closeAccountGroupModal"
      @save-account-group="handleAccountGroupSave" @delete-group-from-modal="handleDeleteGroupFromModal"
      @close-account="closeAccountModal" @save-account="handleAccountSave" @account-transferred="loadPortfolio"
      @close-institution="closeInstitutionModal" @save-institution="handleInstitutionSave"
      @close-delete="closeDeleteConfirm" @confirm-delete="handleConfirmDelete"
      @close-credentials="closeCredentialsModal" @save-credential="(p) => handleCredentialSave(p as CredentialFormPayload)"
      @edit-credential="handleCredentialEdit" @cancel-credential-edit="cancelCredentialEdit" @remove-credential="handleCredentialDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Account, Institution } from '@/models/WealthTrackDataModels';
import { usePortfolio } from '@/composables/usePortfolio';
import { useAccountGroups } from '@/composables/useAccountGroups';
import { useCredentialsModal, type CredentialFormPayload } from '@/composables/useCredentialsModal';
import { useEventsModal } from '@/composables/useEventsModal';
import { debug } from '@/utils/debug';
import { useAccountCrudHandlers } from '@/composables/useAccountCrudHandlers';
import { useInstitutionCrudHandlers } from '@/composables/useInstitutionCrudHandlers';
import { useAccountGroupHandlers } from '@/composables/useAccountGroupHandlers';
import { useAccountHubStats } from '@/composables/useAccountHubStats';
import { useFamilyTabs } from '@composables/useFamilyTabs';
import { authState } from '@/modules/auth';
import AccountHubStats from '@views/AccountHub/AccountHubStats.vue';
import PortfolioTable from '@views/AccountHub/PortfolioTable.vue';
import PortfolioControls from '@views/AccountHub/PortfolioControls.vue';
import FamilyMemberTabs from '@views/AccountHub/FamilyMemberTabs.vue';
import InstitutionsPanel from '@views/AccountHub/InstitutionsPanel.vue';
import AccountHubModals from '@views/AccountHub/AccountHubModals.vue';
import AccountDocumentsModal from '@views/AccountHub/AccountDocumentsModal.vue';
import { apiService } from '@/services/ApiService';
import { institutionCredentialsService } from '@/services/InstitutionCredentialsService';
import { exportAccountsToExcel, exportFamilyToExcel, exportInstitutionsToExcel } from '@/utils/exportToExcel';
import { useHubEventHandlers } from '@/composables/useHubEventHandlers';
import { useShareSaleModal } from '@/composables/useShareSaleModal';
import { useHubReferenceData } from '@/composables/useHubReferenceData';
import { usePortfolioGroups } from '@/composables/usePortfolioGroups';

const { state, lastPriceUpdate, loadPortfolio, clearError } = usePortfolio();
const { state: accountGroupsState, loadGroups, createGroup, updateGroup, deleteGroup, saveGroupMembers } = useAccountGroups();
const grouped = ref(true); const groupByParent = ref(true);
const { accountTypes, accountStatuses, institutionTypes, credentialTypes, lifeExpectancy, annuityRate } = useHubReferenceData();
const { otherMembers, allMembers, activeMemberId, tableItems, activeInstitutions, memberGroups, memberGroupMembersMap, isLoadingMember, memberError, loadFamilyTabs, selectMember, familyId, reloadMemberPortfolio } =
  useFamilyTabs(() => authState.user?.id ?? 0, () => ({ firstName: authState.user?.firstName ?? '', lastName: authState.user?.lastName ?? '' }), computed(() => state.items));
const { hideClosed, visibleItems, totalValue, cashAtHand, isaSavings, illiquid, trustAssets, projectedAnnualYield, pensionBreakdown } =
  useAccountHubStats(tableItems, accountStatuses, lifeExpectancy, annuityRate);
const institutionsToShow = computed<Institution[]>(() => activeInstitutions.value ?? state.institutions);
onMounted(() => { void loadPortfolio(); void loadGroups(); void loadFamilyTabs(); });

const {
  credentialModalOpen, credentialInstitution, credentials, credentialLoading, credentialSaving,
  credentialDeletingId, credentialError, editingCredential, openCredentialsModal, closeCredentialsModal,
  handleCredentialSave, handleCredentialEdit, cancelCredentialEdit, handleCredentialDelete,
} = useCredentialsModal();
const { eventsModalOpen, eventsTitle, eventsLoading, eventsError, events, accountType, currentAccountId, openEventsModal, closeEventsModal } = useEventsModal();
const { shareSaleModalOpen, shareSaleStartTab, openShareSaleModal, openShareSaleModalHistory, closeShareSaleModal, handleShareSold } =
  useShareSaleModal(state, loadPortfolio, currentAccountId, openEventsModal);
const accountModalOpen = ref(false); const institutionModalOpen = ref(false);
const modalType = ref<'create' | 'edit'>('create'); const editingItem = ref<Account | Institution | null>(null);
const deleteConfirmOpen = ref(false); const deleteConfirmType = ref<'account' | 'institution'>('account');
const deleteConfirmId = ref(0); const deleteConfirmName = ref('');
const { portfolioGroups: myGroups, portfolioGroupMembers: myGroupMap } =
  usePortfolioGroups(() => accountGroupsState.groups, () => accountGroupsState.groupMembers);
const { portfolioGroups: memberPortfolioGroups, portfolioGroupMembers: memberPortfolioGroupMap } =
  usePortfolioGroups(() => memberGroups.value, () => memberGroupMembersMap.value);
const portfolioGroups = computed(() => activeMemberId.value === null ? myGroups.value : activeMemberId.value === 'all' ? [...myGroups.value, ...memberPortfolioGroups.value] : memberPortfolioGroups.value);
const groupMembersMap = computed(() => activeMemberId.value === null ? myGroupMap.value : activeMemberId.value === 'all' ? new Map([...myGroupMap.value, ...memberPortfolioGroupMap.value]) : memberPortfolioGroupMap.value);
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
const handleExport = (): void => {
  const date = new Date().toISOString().split('T')[0];
  if (activeMemberId.value === 'all') {
    const sheets = allMembers.value.map((m) => ({ name: `${m.firstName} ${m.lastName}`, items: visibleItems.value.filter((i) => i.account.userId === m.accountId) }));
    exportFamilyToExcel(sheets, `wealthtrack-family-${date}.xlsx`);
  } else {
    exportAccountsToExcel(visibleItems.value, `wealthtrack-accounts-${date}.xlsx`);
  }
};
const exportInstitutions = (): void => { void exportInstitutionsToExcel(state.institutions, (id) => institutionCredentialsService.listCredentials(id), `wealthtrack-institutions-${new Date().toISOString().split('T')[0]}.xlsx`); };
const priceRefreshing = ref(false);
const handleRefreshPrices = async (): Promise<void> => { priceRefreshing.value = true; try { await apiService.refreshPrices(); await loadPortfolio(); } catch (e) { debug.error('[AccountHub] Price refresh failed:', e); } finally { priceRefreshing.value = false; } };
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
const { handleUpdateBalance, handleAddWin, handleSaveDividend, handleSaveGift, handleDeleteGift } = useHubEventHandlers(state, loadPortfolio, currentAccountId, accountType, openEventsModal);

const handleBalanceUpdate = async (accountId: number, value: string): Promise<void> => {
  const memberId = activeMemberId.value;
  if (memberId !== null && memberId !== 'all' && familyId.value !== null) {
    const grossValue = parseFloat(value);
    if (Number.isNaN(grossValue)) { state.error = 'Invalid balance value'; return; }
    try {
      await apiService.createFamilyMemberEvent(familyId.value, memberId, accountId, { eventType: 'Balance', value: grossValue.toString() });
      await reloadMemberPortfolio(memberId);
    } catch (e) { state.error = e instanceof Error ? e.message : 'Failed to update balance'; }
  } else {
    await handleUpdateBalance(accountId, value);
  }
};
const docsModalOpen = ref(false); const docsAccountId = ref(0); const docsAccountName = ref('');
const openDocsModal = (id: number, name: string): void => { docsAccountId.value = id; docsAccountName.value = name; docsModalOpen.value = true; };
</script>
