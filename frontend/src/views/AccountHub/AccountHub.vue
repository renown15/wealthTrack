<template>
  <div class="page-view">
    <div class="hub-header-card">
      <AccountHubStats
        :total-value="totalValue" :account-count="accountCount"
        :institution-count="institutionCount" :event-count="eventCount"
        @create-account="openCreateAccountModal" @create-institution="openCreateInstitutionModal"
      />
    </div>
    <div v-if="state.error" class="hub-content-card p-6">
      <div class="error-banner">
        <span>{{ state.error }}</span>
        <button class="btn-close" @click="clearError">×</button>
      </div>
    </div>
    <div v-if="state.loading" class="hub-content-card p-8 loading-state">
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
    <template v-else>
      <div class="hub-content-card p-6">
        <h3 class="section-title">Accounts</h3>
        <div class="table-wrap">
          <AccountHubTable
            :items="state.items" @edit-account="openEditAccountModal"
            @delete-item="openDeleteConfirm" @show-events="handleShowEvents"
            @update-balance="handleUpdateBalance"
          />
        </div>
      </div>
      <div v-if="state.institutions.length > 0" class="hub-content-card p-6">
        <h3 class="section-title">Institutions</h3>
        <InstitutionsList
          :institutions="state.institutions" @edit-institution="openEditInstitutionModal"
          @delete-institution="(id, name) => openDeleteConfirm('institution', id, name)"
          @manage-credentials="openCredentialsModal"
        />
      </div>
      <AccountEventsModal
        :open="eventsModalOpen" :title="eventsTitle" :events="events"
        :loading="eventsLoading" :error="eventsError" @close="closeEventsModal"
      />
    </template>
    <AddAccountModal
      :open="modalOpen" :type="modalType" :resource-type="modalResourceType"
      :institutions="state.institutions" :account-types="accountTypes"
      :account-statuses="accountStatuses" :initial-name="initialModalName"
      :initial-institution-id="initialModalInstitutionId" :initial-type-id="initialModalTypeId"
      :initial-status-id="initialModalStatusId" :initial-opened-at="initialModalOpenedAt"
      :initial-closed-at="initialModalClosedAt" :initial-account-number="initialModalAccountNumber"
      :initial-sort-code="initialModalSortCode" :initial-roll-ref-number="initialModalRollRefNumber"
      :initial-interest-rate="initialModalInterestRate" :initial-fixed-bonus-rate="initialModalFixedBonusRate"
      :initial-fixed-bonus-rate-end-date="initialModalFixedBonusRateEndDate" :initial-parent-id="initialModalParentId"
      @close="closeModal" @save="handleSave"
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
import { usePortfolio } from '@/composables/usePortfolio';
import { useCredentialsModal } from '@/composables/useCredentialsModal';
import { useEventsModal } from '@/composables/useEventsModal';
import { useAccountHubModals } from '@/composables/useAccountHubModals';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import AccountHubStats from '@views/AccountHub/AccountHubStats.vue';
import AccountHubTable from '@views/AccountHub/AccountHubTable.vue';
import AddAccountModal from '@views/AccountHub/AddAccountModal.vue';
import DeleteConfirmModal from '@views/AccountHub/DeleteConfirmModal.vue';
import InstitutionsList from '@views/AccountHub/InstitutionsList.vue';
import AccountEventsModal from '@views/AccountHub/AccountEventsModal.vue';
import InstitutionCredentialsModal from '@views/AccountHub/InstitutionCredentialsModal.vue';
import { apiService } from '@/services/ApiService';
import { accountCrudService } from '@/services/AccountCrudService';

const {
  state, totalValue, accountCount, loadPortfolio, createAccount, updateAccount,
  deleteAccount, createInstitution, updateInstitution, deleteInstitution, clearError,
} = usePortfolio();

const {
  credentialModalOpen, credentialInstitution, credentials, credentialLoading,
  credentialSaving, credentialDeletingId, credentialError, editingCredential,
  openCredentialsModal, closeCredentialsModal, handleCredentialSave,
  handleCredentialEdit, cancelCredentialEdit, handleCredentialDelete,
} = useCredentialsModal();

const {
  eventsModalOpen, eventsTitle, eventsLoading, eventsError, events,
  openEventsModal, closeEventsModal,
} = useEventsModal();

const {
  modalOpen, modalType, modalResourceType, editingItem, deleteConfirmOpen,
  deleteConfirmType, deleteConfirmId, deleteConfirmName, initialModalName,
  initialModalInstitutionId, initialModalTypeId, initialModalStatusId,
  initialModalOpenedAt, initialModalClosedAt, initialModalAccountNumber,
  initialModalSortCode, initialModalRollRefNumber, initialModalInterestRate,
  initialModalFixedBonusRate, initialModalFixedBonusRateEndDate,
  initialModalParentId,
  openCreateAccountModal, openCreateInstitutionModal, openEditAccountModal,
  openEditInstitutionModal, closeModal, openDeleteConfirm, closeDeleteConfirm,
} = useAccountHubModals();

const institutionCount = computed(() => state.institutions.length);
const eventCount = computed(() => state.items.reduce((t, a) => t + (a.eventCount || 0), 0));
const accountTypes = ref<ReferenceDataItem[]>([]);
const accountStatuses = ref<ReferenceDataItem[]>([]);
const credentialTypes = ref<ReferenceDataItem[]>([]);

const loadReferenceData = async (): Promise<void> => {
  try {
    const [types, statuses, credOpts] = await Promise.all([
      apiService.getReferenceData('account_type'),
      apiService.getReferenceData('account_status'),
      apiService.getReferenceData('credential_type'),
    ]);
    accountTypes.value = types;
    accountStatuses.value = statuses;
    credentialTypes.value = credOpts;
  } catch (error) {
    const axiosErr = error as { response?: { data?: { detail?: string } } };
    state.error = axiosErr.response?.data?.detail
      || (error instanceof Error ? error.message : 'Failed to load reference data');
  }
};

onMounted(() => Promise.all([loadPortfolio(), loadReferenceData()]));

interface SavePayload {
  name: string; institutionId: number;
  typeId?: number; statusId?: number; openedAt?: string; closedAt?: string;
  accountNumber?: string; sortCode?: string; rollRefNumber?: string;
  interestRate?: string; fixedBonusRate?: string; fixedBonusRateEndDate?: string; parentId?: number | null;
}

const handleSave = async (payload: SavePayload): Promise<void> => {
  try {
    console.log('handleSave called with:', payload, 'modalResourceType:', modalResourceType.value, 'modalType:', modalType.value);
    if (modalResourceType.value === 'account') {
      if (modalType.value === 'create') {
        const tId = payload.typeId ?? accountTypes.value[0]?.id;
        const sId = payload.statusId ?? accountStatuses.value[0]?.id;
        if (!tId || !sId) { state.error = 'Select valid type and status'; return; }
        await createAccount(
          payload.institutionId,
          payload.name,
          tId,
          sId,
          payload.accountNumber,
          payload.sortCode,
          payload.rollRefNumber,
          payload.interestRate,
          payload.fixedBonusRate,
          payload.fixedBonusRateEndDate,
        );
      } else if (editingItem.value && 'id' in editingItem.value) {
        await updateAccount(
          editingItem.value.id,
          payload.name,
          payload.typeId,
          payload.statusId,
          payload.accountNumber,
          payload.sortCode,
          payload.rollRefNumber,
          payload.interestRate,
          payload.fixedBonusRate,
          payload.fixedBonusRateEndDate,
        );
        await accountCrudService.updateAccountDates(editingItem.value.id, {
          opened_at: payload.openedAt || null, closed_at: payload.closedAt || null,
        });
        await loadPortfolio();
      }
    } else if (modalType.value === 'create') {
      console.log('Creating institution:', payload.name);
      await createInstitution(payload.name, payload.parentId || null);
    } else if (editingItem.value && 'id' in editingItem.value) {
      await updateInstitution(editingItem.value.id, payload.name, payload.parentId || null);
    }
  } catch (error) { 
    console.error('Error in handleSave:', error);
    state.error = error instanceof Error ? error.message : 'An error occurred';
    return;
  }
  console.log('About to close modal');
  closeModal();
};

const handleConfirmDelete = async (): Promise<void> => {
  try {
    if (deleteConfirmType.value === 'account') await deleteAccount(deleteConfirmId.value);
    else await deleteInstitution(deleteConfirmId.value);
    closeDeleteConfirm();
  } catch { /* error set in state */ }
};

const handleUpdateBalance = async (accountId: number, value: string): Promise<void> => {
  try {
    await apiService.createAccountEvent(accountId, { event_type: 'balance', value });
    await loadPortfolio();
  } catch (error) {
    const axiosErr = error as { response?: { data?: { detail?: string } } };
    state.error = axiosErr.response?.data?.detail
      || (error instanceof Error ? error.message : 'Failed to update balance');
  }
};

const handleShowEvents = (accountId: number, accountName: string): void => {
  openEventsModal(accountId, accountName);
};
</script>

<!-- Uses UnoCSS utilities via shortcuts -->
