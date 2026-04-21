<template>
  <div class="page-view">
    <div class="hub-header-card">
      <TaxHubStats
        :periods="periods"
        :selected-period-id="selectedPeriodId"
        @add-period="addPeriodOpen = true"
        @select-period="handleSelectPeriod"
        @delete-period="openDeleteConfirm"
      />
    </div>

    <div v-if="periodsError" class="hub-content-card p-6">
      <div class="error-banner"><span>{{ periodsError }}</span></div>
    </div>

    <div v-if="selectedPeriodId !== null" class="hub-content-card p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="section-title">Eligible Accounts</h3>
        <button class="btn-modal-secondary" @click="handleOpenQuickAdd">+ Add Closed Account</button>
      </div>
      <TaxHubTable
        :in-scope="inScope"
        :eligible="eligible"
        :loading="accountsLoading"
        :error="accountsError"
        @edit-return="openReturnModal"
        @manage-documents="openDocumentsModal"
        @show-events="handleShowEvents"
        @move-to-in-scope="moveToInScope"
        @move-to-eligible="moveToEligible"
      />
    </div>

    <AddTaxPeriodModal
      :open="addPeriodOpen"
      @close="addPeriodOpen = false"
      @save="handleCreatePeriod"
    />

    <TaxReturnModal
      :open="returnModalOpen"
      :account="activeAccount"
      @close="returnModalOpen = false"
      @save="handleSaveReturn"
    />

    <TaxDocumentsModal
      :open="docsModalOpen"
      :account="activeAccount"
      @close="docsModalOpen = false"
      @upload="handleUpload"
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
import type { TaxPeriodCreateRequest } from '@models/TaxModels';
import { useTaxPeriods } from '@composables/useTaxPeriods';
import { useTaxHub } from '@composables/useTaxHub';
import { useEventsModal } from '@composables/useEventsModal';
import { useTaxHubModals } from '@composables/useTaxHubModals';
import TaxHubStats from '@views/TaxHub/TaxHubStats.vue';
import TaxHubTable from '@views/TaxHub/TaxHubTable.vue';
import AddTaxPeriodModal from '@views/TaxHub/AddTaxPeriodModal.vue';
import TaxReturnModal from '@views/TaxHub/TaxReturnModal.vue';
import TaxDocumentsModal from '@views/TaxHub/TaxDocumentsModal.vue';
import AddAccountModal from '@views/AccountHub/AddAccountModal.vue';
import DeleteConfirmModal from '@views/AccountHub/DeleteConfirmModal.vue';
import AccountEventsModal from '@views/AccountHub/AccountEventsModal.vue';
import DocumentPreviewModal from '@views/TaxHub/DocumentPreviewModal.vue';
import type { EligibleAccount } from '@models/TaxModels';

const {
  periods, selectedPeriodId, error: periodsError,
  loadPeriods, createPeriod, deletePeriod, selectPeriod,
} = useTaxPeriods();

const {
  accounts, inScope, eligible, loading: accountsLoading, error: accountsError,
  loadAccounts, saveReturn, uploadDocument, downloadDocument, fetchDocumentBlob, deleteDocument,
  moveToInScope, moveToEligible,
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
  openReturnModal, openDocumentsModal, openDeleteConfirm,
  handleSaveReturn, handleUpload, handleDownload, handleDeleteDoc,
  handleOpenQuickAdd, handleQuickAdd, handlePreview, closePreview,
} = useTaxHubModals(
  selectedPeriodId, periods, accounts,
  saveReturn, uploadDocument, downloadDocument, fetchDocumentBlob, deleteDocument, moveToInScope,
);

const addPeriodOpen = ref(false);

onMounted(async () => {
  await loadPeriods();
  if (selectedPeriodId.value !== null) await loadAccounts(selectedPeriodId.value);
});

watch(selectedPeriodId, async (id) => {
  if (id !== null) await loadAccounts(id);
  else { inScope.value = []; eligible.value = []; }
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
</script>
