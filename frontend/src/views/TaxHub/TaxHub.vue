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
      </div>
      <TaxHubTable
        :accounts="accounts"
        :loading="accountsLoading"
        :error="accountsError"
        @edit-return="openReturnModal"
        @manage-documents="openDocumentsModal"
        @show-events="handleShowEvents"
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
      @delete-doc="handleDeleteDoc"
    />

    <DeleteConfirmModal
      :open="deleteConfirmOpen"
      :item-name="deleteConfirmName"
      @close="deleteConfirmOpen = false"
      @confirm="handleConfirmDelete"
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
import type { EligibleAccount, TaxPeriodCreateRequest, TaxReturnUpsertRequest } from '@models/TaxModels';
import { useTaxPeriods } from '@composables/useTaxPeriods';
import { useTaxHub } from '@composables/useTaxHub';
import { useEventsModal } from '@composables/useEventsModal';
import TaxHubStats from '@views/TaxHub/TaxHubStats.vue';
import TaxHubTable from '@views/TaxHub/TaxHubTable.vue';
import AddTaxPeriodModal from '@views/TaxHub/AddTaxPeriodModal.vue';
import TaxReturnModal from '@views/TaxHub/TaxReturnModal.vue';
import TaxDocumentsModal from '@views/TaxHub/TaxDocumentsModal.vue';
import DeleteConfirmModal from '@views/AccountHub/DeleteConfirmModal.vue';
import AccountEventsModal from '@views/AccountHub/AccountEventsModal.vue';

const {
  periods, selectedPeriodId, loading: periodsLoading, error: periodsError,
  loadPeriods, createPeriod, deletePeriod, selectPeriod,
} = useTaxPeriods();

const {
  accounts, loading: accountsLoading, error: accountsError,
  loadAccounts, saveReturn, uploadDocument, downloadDocument, deleteDocument,
} = useTaxHub();

const {
  eventsModalOpen, eventsTitle, eventsLoading, eventsError, events, accountType: eventsAccountType,
  openEventsModal, closeEventsModal,
} = useEventsModal();

const addPeriodOpen = ref(false);
const returnModalOpen = ref(false);
const docsModalOpen = ref(false);
const activeAccount = ref<EligibleAccount | null>(null);

const deleteConfirmOpen = ref(false);
const deleteConfirmId = ref(0);
const deleteConfirmName = ref('');

onMounted(async () => {
  await loadPeriods();
  if (selectedPeriodId.value !== null) await loadAccounts(selectedPeriodId.value);
});

watch(selectedPeriodId, async (id) => {
  if (id !== null) await loadAccounts(id);
  else accounts.value = [];
});

function handleSelectPeriod(periodId: number): void {
  selectPeriod(periodId);
}

function openDeleteConfirm(periodId: number, periodName: string): void {
  deleteConfirmId.value = periodId;
  deleteConfirmName.value = periodName;
  deleteConfirmOpen.value = true;
}

async function handleConfirmDelete(): Promise<void> {
  deleteConfirmOpen.value = false;
  await deletePeriod(deleteConfirmId.value);
}

async function handleCreatePeriod(data: TaxPeriodCreateRequest): Promise<void> {
  await createPeriod(data);
  addPeriodOpen.value = false;
}

function openReturnModal(account: EligibleAccount): void {
  activeAccount.value = account;
  returnModalOpen.value = true;
}

function openDocumentsModal(account: EligibleAccount): void {
  activeAccount.value = account;
  docsModalOpen.value = true;
}

async function handleSaveReturn(data: TaxReturnUpsertRequest): Promise<void> {
  if (!activeAccount.value || selectedPeriodId.value === null) return;
  const ok = await saveReturn(selectedPeriodId.value, activeAccount.value.accountId, data);
  if (ok) returnModalOpen.value = false;
}

async function handleUpload(file: File): Promise<void> {
  if (!activeAccount.value || selectedPeriodId.value === null) return;
  await uploadDocument(selectedPeriodId.value, activeAccount.value.accountId, file);
  activeAccount.value = accounts.value.find((a) => a.accountId === activeAccount.value?.accountId) ?? activeAccount.value;
}

async function handleDownload(docId: number, filename: string): Promise<void> {
  await downloadDocument(docId, filename);
}

async function handleShowEvents(account: EligibleAccount): Promise<void> {
  await openEventsModal(account.accountId, account.accountName, account.accountType);
}

async function handleDeleteDoc(docId: number): Promise<void> {
  if (!activeAccount.value || selectedPeriodId.value === null) return;
  await deleteDocument(selectedPeriodId.value, activeAccount.value.accountId, docId);
  activeAccount.value = accounts.value.find((a) => a.accountId === activeAccount.value?.accountId) ?? activeAccount.value;
}
</script>
