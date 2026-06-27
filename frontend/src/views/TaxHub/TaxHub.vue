<template>
  <div class="page-view">
    <div class="hub-header-card">
      <TaxHubStats
        :periods="periods"
        :selected-period-id="selectedPeriodId"
        @add-period="addPeriodOpen = true"
        @open-quick-add="handleOpenQuickAdd"
        @export-briefing="briefingOpen = true"
        @select-period="handleSelectPeriod"
        @delete-period="openDeleteConfirm"
      />
    </div>

    <div v-if="periodsError" class="hub-content-card p-6">
      <div class="error-banner"><span>{{ periodsError }}</span></div>
    </div>

    <GiftsSummary />

    <BriefingPackModal :open="briefingOpen" @close="briefingOpen = false" />

    <div v-if="selectedPeriodId !== null" class="hub-content-card p-6">
      <div class="flex items-center justify-between mb-6 gap-2">
        <h3 class="section-title">Eligible Accounts</h3>
        <input :value="search" type="search" placeholder="Search name, institution, acc no, sort code…" class="px-3 py-1.5 border border-gray-300 rounded text-xs w-44 sm:w-72" @input="search = ($event.target as HTMLInputElement).value" />
      </div>
      <TaxHubTable
        :in-scope="filteredInScope" :eligible="filteredEligible" :tax-free="filteredTaxFree" :not-in-scope="filteredNotInScope"
        :loading="accountsLoading" :error="accountsError"
        :portfolio-item-map="portfolioItemMap"
        @edit-return="openReturnModal" @edit-account="handleEditAccount"
        @manage-documents="openDocumentsModal" @show-events="handleShowEvents"
        @move-to-in-scope="moveToInScope" @move-to-eligible="moveToEligible"
        @mark-out-of-scope="openScopeModal" @clear-scope="handleClearScope"
      />
    </div>

    <AddTaxPeriodModal
      :open="addPeriodOpen"
      @close="addPeriodOpen = false"
      @save="handleCreatePeriod"
    />

    <TaxReturnModal :open="returnModalOpen" :account="activeAccount"
      @close="returnModalOpen = false" @save="handleSaveReturn" />

    <TaxScopeModal :open="scopeModalOpen" :account="activeAccount"
      @close="scopeModalOpen = false" @save="handleSaveScope" />

    <AccountModal :open="editAccountOpen" type="edit" :institutions="quickAddInstitutions"
      :account-types="accountTypes" :account-statuses="accountStatuses"
      :account-id="editingPortfolioItem?.account.id" :initial-name="editingPortfolioItem?.account.name"
      :initial-institution-id="editingPortfolioItem?.account.institutionId"
      :initial-type-id="editingPortfolioItem?.account.typeId" :initial-status-id="editingPortfolioItem?.account.statusId"
      :initial-opened-at="editingPortfolioItem?.account.openedAt" :initial-account-number="editingPortfolioItem?.account.accountNumber"
      :initial-sort-code="editingPortfolioItem?.account.sortCode" :initial-roll-ref-number="editingPortfolioItem?.account.rollRefNumber"
      :initial-interest-rate="editingPortfolioItem?.account.interestRate" @close="editAccountOpen = false" @save="handleSaveEditedAccount" />

    <TaxDocumentsModal
      :open="docsModalOpen"
      :account="activeAccount"
      @close="docsModalOpen = false"
      @upload="(file, desc) => handleUpload(file, desc)"
      @update-description="handleUpdateDescription"
      @download="handleDownload"
      @preview="handlePreview"
      @delete-doc="handleDeleteDoc"
    />

    <DocumentPreviewModal
      :open="previewOpen"
      :url="previewUrl"
      :filename="previewFilename"
      :content-type="previewContentType"
      @close="closePreview"
    />

    <DeleteConfirmModal
      :open="deleteConfirmOpen"
      :item-name="deleteConfirmName"
      @close="deleteConfirmOpen = false"
      @confirm="handleConfirmDelete"
    />

    <AddAccountModal
      :open="quickAddOpen"
      type="create"
      resource-type="account"
      :institutions="quickAddInstitutions"
      :account-types="quickAddTypes"
      :account-statuses="quickAddStatuses"
      :institution-types="quickAddInstitutionTypes"
      :initial-account-data="quickAddInitialData"
      :hide-opened-date="true"
      :closed-account-mode="true"
      @close="quickAddOpen = false"
      @save="handleQuickAdd"
    />

    <AccountEventsModal
      :open="eventsModalOpen"
      :title="eventsTitle"
      :events="events"
      :loading="eventsLoading"
      :error="eventsError"
      :account-type="eventsAccountType"
      @close="closeEventsModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { TaxPeriodCreateRequest, EligibleAccount } from '@models/TaxModels';
import type { PortfolioItem } from '@models/WealthTrackDataModels';
import { apiService } from '@services/ApiService';
import type { SavePayload } from '@views/AccountHub/accountModalSave';
import { useTaxPeriods } from '@composables/useTaxPeriods';
import { useTaxHub } from '@composables/useTaxHub';
import { useEventsModal } from '@composables/useEventsModal';
import { useTaxHubModals } from '@composables/useTaxHubModals';
import { useHubReferenceData } from '@composables/useHubReferenceData';
import TaxHubStats from '@views/TaxHub/TaxHubStats.vue';
import TaxHubTable from '@views/TaxHub/TaxHubTable.vue';
import AddTaxPeriodModal from '@views/TaxHub/AddTaxPeriodModal.vue';
import TaxReturnModal from '@views/TaxHub/TaxReturnModal.vue';
import TaxScopeModal from '@views/TaxHub/TaxScopeModal.vue';
import TaxDocumentsModal from '@views/TaxHub/TaxDocumentsModal.vue';
import AddAccountModal from '@views/AccountHub/AddAccountModal.vue';
import AccountModal from '@views/AccountHub/AccountModal.vue';
import DeleteConfirmModal from '@views/AccountHub/DeleteConfirmModal.vue';
import AccountEventsModal from '@views/AccountHub/AccountEventsModal.vue';
import DocumentPreviewModal from '@views/TaxHub/DocumentPreviewModal.vue';
import GiftsSummary from '@views/TaxHub/GiftsSummary.vue';
import BriefingPackModal from '@views/TaxHub/BriefingPackModal.vue';

const {
  periods, selectedPeriodId, error: periodsError,
  loadPeriods, createPeriod, deletePeriod, selectPeriod,
} = useTaxPeriods();

const {
  accounts, inScope, eligible, taxFree, notInScope, loading: accountsLoading, error: accountsError,
  search, filteredInScope, filteredEligible, filteredTaxFree, filteredNotInScope,
  loadAccounts, saveReturn, uploadDocument, updateDocumentDescription, downloadDocument, fetchDocumentBlob, deleteDocument,
  moveToInScope, moveToEligible, setScope,
} = useTaxHub();

const {
  eventsModalOpen, eventsTitle, eventsLoading, eventsError, events, accountType: eventsAccountType,
  openEventsModal, closeEventsModal,
} = useEventsModal();

const {
  returnModalOpen, docsModalOpen, quickAddOpen,
  activeAccount, deleteConfirmOpen, deleteConfirmId, deleteConfirmName,
  quickAddInitialData, quickAddInstitutions, quickAddTypes, quickAddStatuses, quickAddInstitutionTypes,
  previewOpen, previewUrl, previewFilename, previewContentType,
  scopeModalOpen, openScopeModal, handleSaveScope, handleClearScope,
  openReturnModal, openDocumentsModal, openDeleteConfirm,
  handleSaveReturn, handleUpload, handleUpdateDescription, handleDownload, handleDeleteDoc,
  loadFormData, handleOpenQuickAdd, handleQuickAdd, handlePreview, closePreview,
} = useTaxHubModals(
  selectedPeriodId, periods, accounts,
  saveReturn, uploadDocument, updateDocumentDescription, downloadDocument, fetchDocumentBlob, deleteDocument, moveToInScope, setScope,
);

const { accountTypes, accountStatuses } = useHubReferenceData();
const addPeriodOpen = ref(false);
const briefingOpen = ref(false);
const portfolioItemMap = ref<Record<number, PortfolioItem>>({});
const editAccountOpen = ref(false);
const editingPortfolioItem = ref<PortfolioItem | null>(null);

onMounted(async () => {
  await loadPeriods();
  if (selectedPeriodId.value !== null) await loadAccounts(selectedPeriodId.value);
  try {
    const result = await apiService.getPortfolio();
    portfolioItemMap.value = Object.fromEntries((result.items ?? []).map((i: PortfolioItem) => [i.account.id, i]));
  } catch { /* hover card is non-critical */ }
});

watch(selectedPeriodId, async (id) => {
  if (id !== null) await loadAccounts(id);
  else { inScope.value = []; eligible.value = []; taxFree.value = []; notInScope.value = []; }
});

function handleSelectPeriod(periodId: number): void {
  selectPeriod(periodId);
}

async function handleCreatePeriod(data: TaxPeriodCreateRequest): Promise<void> {
  await createPeriod(data);
  addPeriodOpen.value = false;
}

async function handleConfirmDelete(): Promise<void> {
  deleteConfirmOpen.value = false;
  await deletePeriod(deleteConfirmId.value);
}

async function handleShowEvents(account: EligibleAccount): Promise<void> {
  await openEventsModal(account.accountId, account.accountName, account.accountType);
}

async function handleEditAccount(account: EligibleAccount): Promise<void> {
  await loadFormData();
  editingPortfolioItem.value = portfolioItemMap.value[account.accountId] ?? null;
  editAccountOpen.value = true;
}

async function handleSaveEditedAccount(payload: SavePayload): Promise<void> {
  if (!editingPortfolioItem.value) return;
  const id = editingPortfolioItem.value.account.id;
  await apiService.updateAccount(id, payload as never);
  await apiService.updateAccountDates(id, { opened_at: payload.openedAt || null, closed_at: payload.closedAt || null });
  editAccountOpen.value = false;
  if (selectedPeriodId.value !== null) await loadAccounts(selectedPeriodId.value);
  portfolioItemMap.value = Object.fromEntries(((await apiService.getPortfolio()).items ?? []).map((i: PortfolioItem) => [i.account.id, i]));
}
</script>
