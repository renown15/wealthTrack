<template>
  <div class="page-view">
    <div class="hub-header-card">
      <OutgoingsHubStats
        :stats="displayedStats" :total-count="displayedOutgoings.length" :read-only="readOnly"
        @add-account="openCreate" @add-provider="providersPanel?.openCreate()"
      />
    </div>

    <div class="hub-content-card p-3 sm:p-6">
      <FamilyMemberTabs
        v-if="otherMembers.length > 0"
        :members="otherMembers"
        :active-id="activeMemberId"
        @select="selectMember"
      />

      <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 class="section-title">Outgoings</h3>
        <input
          :value="search"
          type="search"
          placeholder="Search name, provider, type, acc no…"
          class="px-3 py-1.5 border border-gray-300 rounded text-xs w-44 sm:w-72"
          @input="search = ($event.target as HTMLInputElement).value"
        />
      </div>

      <OutgoingsTable
        :items="visibleOutgoings"
        :loading="loading"
        :error="error"
        :read-only="readOnly"
        :projections="projections"
        @edit-account="openEdit"
        @delete-account="openDeleteConfirm"
        @show-docs="(item) => openDocs(item.account.id, item.account.name)"
        @show-actuals="openActuals"
      />

      <OutgoingsProvidersPanel
        ref="providersPanel"
        :providers="displayedProviders"
        :institution-types="outgoingInstitutionTypes"
        :credential-types="credentialTypes"
        :read-only="readOnly"
        @changed="loadInstitutions"
      />
    </div>

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
      :initial-renewal-type="editingItem?.account.renewalType"
      :initial-monthly-cost="editingItem?.account.monthlyCost"
      :initial-costing-method="editingItem?.account.costingMethod"
      :initial-outgoing-end-date="editingItem?.account.outgoingEndDate"
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

    <OutgoingActualsModal
      :open="actualsModalOpen"
      :account-id="actualsAccountId"
      :account-name="actualsAccountName"
      @close="actualsModalOpen = false"
      @changed="loadProjections"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Institution, PortfolioItem } from '@models/WealthTrackDataModels';
import { apiService } from '@services/ApiService';
import {
  useOutgoings, computeOutgoingsStats, filterOutgoings, searchAndSortOutgoings,
} from '@composables/useOutgoings';
import { useHubReferenceData } from '@composables/useHubReferenceData';
import { useFamilyTabs } from '@composables/useFamilyTabs';
import { useOutgoingsHubModals } from '@composables/useOutgoingsHubModals';
import { useOutgoingTypes, isOutgoingInstitution } from '@composables/outgoingTypes';
import { authState } from '@/modules/auth';
import OutgoingsHubStats from '@views/OutgoingsHub/OutgoingsHubStats.vue';
import OutgoingsTable from '@views/OutgoingsHub/OutgoingsTable.vue';
import OutgoingsProvidersPanel from '@views/OutgoingsHub/OutgoingsProvidersPanel.vue';
import FamilyMemberTabs from '@views/AccountHub/FamilyMemberTabs.vue';
import AccountModal from '@views/AccountHub/AccountModal.vue';
import DeleteConfirmModal from '@views/AccountHub/DeleteConfirmModal.vue';
import AccountDocumentsModal from '@views/AccountHub/AccountDocumentsModal.vue';
import OutgoingActualsModal from '@views/OutgoingsHub/OutgoingActualsModal.vue';

const {
  items, projections, loading, error,
  loadPortfolio, loadProjections, createAccount, updateAccount, deleteAccount,
} = useOutgoings();
const { accountStatuses, credentialTypes } = useHubReferenceData();
const { outgoingAccountTypes, outgoingInstitutionTypes } = useOutgoingTypes();
const {
  accountModalOpen, modalType, editingItem,
  deleteConfirmOpen, deleteConfirmName,
  docsModalOpen, docsAccountId, docsAccountName,
  actualsModalOpen, actualsAccountId, actualsAccountName,
  openCreate, openEdit, closeAccountModal,
  openDeleteConfirm, openDocs, openActuals, handleSave, handleConfirmDelete,
} = useOutgoingsHubModals({ createAccount, updateAccount, deleteAccount, error });

// Household/family view: switch the displayed outgoings to the active member's.
const { otherMembers, activeMemberId, tableItems, selectMember, loadFamilyTabs } = useFamilyTabs(
  () => authState.user?.id ?? 0,
  () => ({ firstName: authState.user?.firstName ?? '', lastName: authState.user?.lastName ?? '' }),
  computed(() => items.value),
);
const readOnly = computed(() => activeMemberId.value !== null);
const displayedOutgoings = computed(() => filterOutgoings(tableItems.value));
const displayedStats = computed(() =>
  computeOutgoingsStats(displayedOutgoings.value, projections.value));

// Search + a sensible default order (group by type, then provider, then name).
const search = ref('');
const visibleOutgoings = computed(() =>
  searchAndSortOutgoings(displayedOutgoings.value, search.value));

// Providers panel: your own institutions (editable) on "Me"; on a member/All tab
// show the providers attached to the displayed outgoings, read-only.
const displayedProviders = computed<Institution[]>(() => {
  if (!readOnly.value) return outgoingProviders.value;
  const map = new Map<number, Institution>();
  for (const item of displayedOutgoings.value) {
    if (item.institution) map.set(item.institution.id, item.institution);
  }
  return [...map.values()];
});

const institutions = ref<Institution[]>([]);
const providersPanel = ref<InstanceType<typeof OutgoingsProvidersPanel> | null>(null);

const outgoingProviders = computed(() =>
  institutions.value.filter((i) => isOutgoingInstitution(i.institutionType))
);

async function loadInstitutions(): Promise<void> {
  try {
    institutions.value = await apiService.getInstitutions();
  } catch { /* non-critical */ }
}

onMounted(async () => {
  await loadPortfolio();
  await loadInstitutions();
  void loadFamilyTabs();
});
</script>
