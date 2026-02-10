<template>
  <div class="portfolio-view">
    <!-- Header with stats -->
    <AccountHubStats
      :total-value="totalValue"
      :account-count="accountCount"
      :institution-count="institutionCount"
      :event-count="eventCount"
      @create-account="openCreateAccountModal"
      @create-institution="openCreateInstitutionModal"
    />

    <!-- Error Message -->
    <div v-if="state.error" class="error-banner">
      <span>{{ state.error }}</span>
      <button @click="clearError">×</button>
    </div>

    <!-- Loading State -->
    <div v-if="state.loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading portfolio...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="accountCount === 0" class="empty-state">
      <div class="empty-state-icon">📊</div>
      <h2>No accounts yet</h2>
      <p>Create your first account to get started</p>
      <button class="btn btn-primary" @click="openCreateAccountModal">Create Account</button>
    </div>

    <!-- Portfolio Content -->
    <div v-else class="portfolio-content">
      <!-- Accounts Table/Grid -->
      <AccountHubTable
        :items="state.items"
        @edit-account="openEditAccountModal"
        @delete-item="openDeleteConfirm"
        @add-account="openCreateAccountModal"
        @show-events="openEventsModal"
      />

      <!-- Institutions List -->
      <InstitutionsList
          :institutions="state.institutions"
          @edit-institution="openEditInstitutionModal"
          @delete-institution="handleDeleteInstitution"
          @manage-credentials="openCredentialsModal"
        />

      <AccountEventsModal
        :open="eventsModalOpen"
        :title="eventsTitle"
        :events="events"
        :loading="eventsLoading"
        :error="eventsError"
        @close="closeEventsModal"
      />
    </div>

    <!-- Create/Edit Modal -->
    <AddAccountModal
      :open="modalOpen"
      :type="modalType"
      :resource-type="modalResourceType"
      :institutions="state.institutions"
      :account-types="accountTypes"
      :account-statuses="accountStatuses"
      :initial-name="initialModalName"
      :initial-institution-id="initialModalInstitutionId"
      :initial-type-id="initialModalTypeId"
      :initial-status-id="initialModalStatusId"
      @close="closeModal"
      @save="handleSave"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :open="deleteConfirmOpen"
      :item-name="deleteConfirmName"
      @close="closeDeleteConfirm"
      @confirm="handleConfirmDelete"
    />

    <InstitutionCredentialsModal
      :open="credentialModalOpen"
      :institution="credentialInstitution"
      :credential-types="credentialTypes"
      :credentials="credentials"
      :loading="credentialLoading"
      :saving="credentialSaving"
      :deleting-id="credentialDeletingId"
      :error="credentialError"
      :editing-credential="editingCredential"
      @close="closeCredentialsModal"
      @save="handleCredentialSave"
      @edit="handleCredentialEdit"
      @cancel-edit="cancelCredentialEdit"
      @remove="handleCredentialDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { usePortfolio } from '@/composables/usePortfolio';
import type { Account, AccountEvent, Institution } from '@/models/Portfolio';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import AccountHubStats from '@views/AccountHub/AccountHubStats.vue';
import AccountHubTable from '@views/AccountHub/AccountHubTable.vue';
import AddAccountModal from '@views/AccountHub/AddAccountModal.vue';
import DeleteConfirmModal from '@views/AccountHub/DeleteConfirmModal.vue';
import InstitutionsList from '@views/AccountHub/InstitutionsList.vue';
import AccountEventsModal from '@views/AccountHub/AccountEventsModal.vue';
import InstitutionCredentialsModal from '@views/AccountHub/InstitutionCredentialsModal.vue';
import { apiService } from '@/services/ApiService';
import { institutionCredentialsService } from '@/services/InstitutionCredentialsService';
import type { InstitutionCredential } from '@/models/InstitutionCredential';

const {
  state,
  totalValue,
  accountCount,
  loadPortfolio,
  createAccount,
  updateAccount,
  deleteAccount,
  createInstitution,
  updateInstitution,
  deleteInstitution,
  clearError,
} = usePortfolio();

const institutionCount = computed(() => state.institutions.length);
const eventCount = computed(() => state.items.reduce((total, account) => total + (account.eventCount || 0), 0));
const accountTypes = ref<ReferenceDataItem[]>([]);
const accountStatuses = ref<ReferenceDataItem[]>([]);
const credentialTypes = ref<ReferenceDataItem[]>([]);
const loadReferenceData = async (): Promise<void> => {
  try {
    const [types, statuses, credentialOptions] = await Promise.all([
      apiService.getReferenceData('account_type'),
      apiService.getReferenceData('account_status'),
      apiService.getReferenceData('credential_type'),
    ]);
    accountTypes.value = types;
    accountStatuses.value = statuses;
    credentialTypes.value = credentialOptions;
  } catch (error) {
    state.error = error instanceof Error ? error.message : 'Failed to load reference data';
  }
};

// Modal state
const modalOpen = ref(false);
const modalType = ref<'create' | 'edit'>('create');
const modalResourceType = ref<'account' | 'institution'>('account');
const editingItem = ref<Account | Institution | null>(null);

const initialModalName = computed(() => {
  if (!editingItem.value) return '';
  return 'name' in editingItem.value ? editingItem.value.name : '';
});
const initialModalInstitutionId = computed(() => {
  if (!editingItem.value || !('institutionId' in editingItem.value)) return 0;
  return (editingItem.value as Account).institutionId;
});
const initialModalTypeId = computed(() => {
  if (!editingItem.value || !('typeId' in editingItem.value)) return 0;
  return editingItem.value.typeId;
});
const initialModalStatusId = computed(() => {
  if (!editingItem.value || !('statusId' in editingItem.value)) return 0;
  return editingItem.value.statusId;
});

// Delete confirmation state
const deleteConfirmOpen = ref(false);
const deleteConfirmType = ref<'account' | 'institution'>('account');
const deleteConfirmId = ref(0);
const deleteConfirmName = ref('');

const credentialModalOpen = ref(false);
const credentialInstitution = ref<Institution | null>(null);
const credentials = ref<InstitutionCredential[]>([]);
const credentialLoading = ref(false);
const credentialSaving = ref(false);
const credentialDeletingId = ref<number | null>(null);
const credentialError = ref<string | null>(null);
const editingCredential = ref<InstitutionCredential | null>(null);

// Load portfolio on mount
onMounted(async () => {
  await Promise.all([loadPortfolio(), loadReferenceData()]);
});
const openCreateAccountModal = (): void => {
  modalType.value = 'create';
  modalResourceType.value = 'account';
  editingItem.value = null;
  modalOpen.value = true;
};

const openCreateInstitutionModal = (): void => {
  modalType.value = 'create';
  modalResourceType.value = 'institution';
  editingItem.value = null;
  modalOpen.value = true;
};

const openEditAccountModal = (account: Account): void => {
  modalType.value = 'edit';
  modalResourceType.value = 'account';
  editingItem.value = account;
  modalOpen.value = true;
};

const openEditInstitutionModal = (institution: Institution): void => {
  modalType.value = 'edit';
  modalResourceType.value = 'institution';
  editingItem.value = institution;
  modalOpen.value = true;
};

const handleDeleteInstitution = (id: number, name: string): void => {
  openDeleteConfirm('institution', id, name);
};

const closeModal = (): void => {
  modalOpen.value = false;
  editingItem.value = null;
};

interface AddAccountSavePayload {
  name: string;
  institutionId: number;
  typeId?: number;
  statusId?: number;
}

const handleSave = async (payload: AddAccountSavePayload): Promise<void> => {
  try {
    if (modalResourceType.value === 'account') {
      if (modalType.value === 'create') {
        const resolvedTypeId = payload.typeId ?? accountTypes.value[0]?.id;
        const resolvedStatusId = payload.statusId ?? accountStatuses.value[0]?.id;
        if (!resolvedTypeId || !resolvedStatusId) {
          state.error = 'Please select a valid account type and status';
          return;
        }
        await createAccount(
          payload.institutionId,
          payload.name,
          resolvedTypeId,
          resolvedStatusId,
        );
      } else if (editingItem.value && 'id' in editingItem.value) {
        await updateAccount(editingItem.value.id, payload.name);
      }
    } else if (modalType.value === 'create') {
      await createInstitution(payload.name);
    } else if (editingItem.value && 'id' in editingItem.value) {
      await updateInstitution(editingItem.value.id, payload.name);
    }
    closeModal();
  } catch (error) {
    // Error already set in state
  }
};

const openDeleteConfirm = (type: 'account' | 'institution', id: number, name: string): void => {
  deleteConfirmType.value = type;
  deleteConfirmId.value = id;
  deleteConfirmName.value = name;
  deleteConfirmOpen.value = true;
};

const closeDeleteConfirm = (): void => {
  deleteConfirmOpen.value = false;
};

const handleConfirmDelete = async (): Promise<void> => {
  try {
    if (deleteConfirmType.value === 'account') {
      await deleteAccount(deleteConfirmId.value);
    } else {
      await deleteInstitution(deleteConfirmId.value);
    }
    closeDeleteConfirm();
  } catch (error) {
    // Error already set in state
  }
};

const fetchCredentials = async (institutionId: number): Promise<void> => {
  credentialLoading.value = true;
  credentialError.value = null;
  try {
    credentials.value = await institutionCredentialsService.listCredentials(institutionId);
  } catch (error) {
    credentialError.value = error instanceof Error ? error.message : 'Unable to load credentials';
  } finally {
    credentialLoading.value = false;
  }
};

const openCredentialsModal = async (institution: Institution): Promise<void> => {
  credentialInstitution.value = institution;
  credentialModalOpen.value = true;
  editingCredential.value = null;
  await fetchCredentials(institution.id);
};

const closeCredentialsModal = (): void => {
  credentialModalOpen.value = false;
  credentialInstitution.value = null;
  credentials.value = [];
  credentialError.value = null;
  editingCredential.value = null;
  credentialDeletingId.value = null;
};

interface CredentialFormPayload {
  typeId: number;
  key: string;
  value: string;
}

const handleCredentialSave = async (payload: CredentialFormPayload): Promise<void> => {
  if (!credentialInstitution.value) return;
  credentialSaving.value = true;
  credentialError.value = null;
  try {
    if (editingCredential.value) {
      await institutionCredentialsService.updateCredential(
        credentialInstitution.value.id,
        editingCredential.value.id,
        payload,
      );
    } else {
      await institutionCredentialsService.createCredential(
        credentialInstitution.value.id,
        payload,
      );
    }
    await fetchCredentials(credentialInstitution.value.id);
    editingCredential.value = null;
  } catch (error) {
    credentialError.value = error instanceof Error ? error.message : 'Unable to save credential';
  } finally {
    credentialSaving.value = false;
  }
};

const handleCredentialEdit = (credential: InstitutionCredential): void => {
  editingCredential.value = credential;
};

const cancelCredentialEdit = (): void => {
  editingCredential.value = null;
};

const handleCredentialDelete = async (credentialId: number): Promise<void> => {
  if (!credentialInstitution.value) return;
  credentialDeletingId.value = credentialId;
  credentialError.value = null;
  try {
    await institutionCredentialsService.deleteCredential(
      credentialInstitution.value.id,
      credentialId,
    );
    await fetchCredentials(credentialInstitution.value.id);
  } catch (error) {
    credentialError.value = error instanceof Error ? error.message : 'Unable to delete credential';
  } finally {
    credentialDeletingId.value = null;
  }
};

const eventsModalOpen = ref(false);
const eventsTitle = ref('');
const eventsLoading = ref(false);
const eventsError = ref<string | undefined>(undefined);
const events = ref<AccountEvent[]>([]);

const openEventsModal = async (
  accountId: number,
  accountName: string,
  _eventCount: number,
): Promise<void> => {
  eventsModalOpen.value = true;
  eventsTitle.value = `${accountName} · Events`;
  eventsLoading.value = true;
  eventsError.value = undefined;
  events.value = [];

  try {
    events.value = await apiService.getAccountEvents(accountId);
  } catch (error) {
    eventsError.value = error instanceof Error ? error.message : 'Unable to load events';
  } finally {
    eventsLoading.value = false;
  }
};

const closeEventsModal = (): void => {
  eventsModalOpen.value = false;
  events.value = [];
  eventsError.value = undefined;
};
</script>

<style scoped src="@/styles/PortfolioView.css"></style>
