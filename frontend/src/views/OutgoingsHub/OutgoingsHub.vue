<template>
  <div class="page-view">
    <OutgoingsHubStats
      :stats="stats" :total-count="outgoingItems.length"
      @add-account="openCreate" @add-provider="providerModalOpen = true"
    />

    <OutgoingsTable
      :items="outgoingItems"
      :loading="loading"
      :error="error"
      @edit-account="openEdit"
      @delete-account="openDeleteConfirm"
      @show-docs="(item) => openDocs(item.account.id, item.account.name)"
    />

    <AccountModal
      :open="accountModalOpen"
      :type="modalType"
      :institutions="outgoingProviders"
      :account-types="outgoingAccountTypes"
      :account-statuses="accountStatuses"
      :account-id="editingItem?.account.id"
      :initial-name="editingItem?.account.name"
      :initial-institution-id="editingItem?.account.institutionId"
      :initial-type-id="editingItem?.account.typeId"
      :initial-status-id="editingItem?.account.statusId"
      :initial-account-number="editingItem?.account.accountNumber"
      :initial-renewal-date="editingItem?.account.renewalDate"
      :initial-monthly-cost="editingItem?.account.monthlyCost"
      @close="closeAccountModal"
      @save="handleSave"
      @transferred="loadPortfolio"
    />

    <DeleteConfirmModal
      :open="deleteConfirmOpen"
      :item-name="deleteConfirmName"
      @close="deleteConfirmOpen = false"
      @confirm="handleConfirmDelete"
    />

    <AccountDocumentsModal
      :open="docsModalOpen"
      :account-id="docsAccountId"
      :account-name="docsAccountName"
      @close="docsModalOpen = false"
      @uploaded="loadPortfolio"
      @deleted="loadPortfolio"
    />

    <InstitutionModal
      :open="providerModalOpen"
      type="create"
      :institutions="outgoingProviders"
      :institution-types="outgoingInstitutionTypes"
      @close="providerModalOpen = false"
      @save="handleSaveProvider"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Institution, PortfolioItem } from '@models/WealthTrackDataModels';
import { apiService } from '@services/ApiService';
import { useOutgoings } from '@composables/useOutgoings';
import { useHubReferenceData } from '@composables/useHubReferenceData';
import { useToast } from '@composables/useToast';
import { OUTGOING_TYPES, OUTGOING_INSTITUTION_TYPES, isOutgoingInstitution } from '@composables/portfolioCalculations';
import type { SavePayload } from '@views/AccountHub/accountModalSave';
import OutgoingsHubStats from '@views/OutgoingsHub/OutgoingsHubStats.vue';
import OutgoingsTable from '@views/OutgoingsHub/OutgoingsTable.vue';
import AccountModal from '@views/AccountHub/AccountModal.vue';
import InstitutionModal from '@views/AccountHub/InstitutionModal.vue';
import DeleteConfirmModal from '@views/AccountHub/DeleteConfirmModal.vue';
import AccountDocumentsModal from '@views/AccountHub/AccountDocumentsModal.vue';

const { outgoingItems, stats, loading, error, loadPortfolio, createAccount, updateAccount, deleteAccount } = useOutgoings();
const { accountTypes, accountStatuses, institutionTypes } = useHubReferenceData();
const { showSuccess, showError } = useToast();

const institutions = ref<Institution[]>([]);
const accountModalOpen = ref(false);
const modalType = ref<'create' | 'edit'>('create');
const editingItem = ref<PortfolioItem | null>(null);
const deleteConfirmOpen = ref(false);
const deleteConfirmId = ref(0);
const deleteConfirmName = ref('');
const docsModalOpen = ref(false);
const docsAccountId = ref(0);
const docsAccountName = ref('');

const providerModalOpen = ref(false);

const outgoingAccountTypes = computed(() =>
  accountTypes.value.filter((t) => OUTGOING_TYPES.includes(t.referenceValue))
);
const outgoingProviders = computed(() =>
  institutions.value.filter((i) => isOutgoingInstitution(i.institutionType))
);
const outgoingInstitutionTypes = computed(() =>
  institutionTypes.value.filter((t) => OUTGOING_INSTITUTION_TYPES.includes(t.referenceValue))
);

async function handleSaveProvider(payload: { name: string; parentId?: number | null; institutionType?: string | null }): Promise<void> {
  try {
    await apiService.createInstitution({
      name: payload.name, parentId: payload.parentId ?? null, institutionType: payload.institutionType ?? null,
    });
    providerModalOpen.value = false;
    institutions.value = await apiService.getInstitutions();
    showSuccess('Provider added');
  } catch (e) {
    showError(e instanceof Error ? e.message : 'Failed to add provider');
  }
}

function openCreate(): void {
  modalType.value = 'create';
  editingItem.value = null;
  accountModalOpen.value = true;
}

function openEdit(item: PortfolioItem): void {
  modalType.value = 'edit';
  editingItem.value = item;
  accountModalOpen.value = true;
}

function closeAccountModal(): void {
  accountModalOpen.value = false;
  editingItem.value = null;
}

function openDeleteConfirm(item: PortfolioItem): void {
  deleteConfirmId.value = item.account.id;
  deleteConfirmName.value = item.account.name;
  deleteConfirmOpen.value = true;
}

function openDocs(accountId: number, accountName: string): void {
  docsAccountId.value = accountId;
  docsAccountName.value = accountName;
  docsModalOpen.value = true;
}

async function handleSave(payload: SavePayload): Promise<void> {
  const item = editingItem.value;
  if (item) {
    const ok = await updateAccount(item.account.id, payload);
    if (ok) { showSuccess('Account updated'); closeAccountModal(); }
    else showError(error.value ?? 'Update failed');
  } else {
    const acc = await createAccount(payload);
    if (acc) { showSuccess('Account added'); closeAccountModal(); }
    else showError(error.value ?? 'Create failed');
  }
}

async function handleConfirmDelete(): Promise<void> {
  deleteConfirmOpen.value = false;
  const ok = await deleteAccount(deleteConfirmId.value);
  if (ok) showSuccess('Account deleted');
  else showError(error.value ?? 'Delete failed');
}

onMounted(async () => {
  await loadPortfolio();
  try {
    institutions.value = await apiService.getInstitutions();
  } catch { /* non-critical */ }
});
</script>
