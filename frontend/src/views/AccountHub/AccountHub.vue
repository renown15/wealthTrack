<template>
  <div class="portfolio-view">
    <!-- Header with stats -->
    <AccountHubStats
      :total-value="totalValue"
      :account-count="accountCount"
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
      />

      <!-- Institutions List -->
      <InstitutionsList
        :institutions="state.institutions"
        @edit-institution="openEditInstitutionModal"
        @delete-institution="handleDeleteInstitution"
      />
    </div>

    <!-- Create/Edit Modal -->
    <AddAccountModal
      :open="modalOpen"
      :type="modalType"
      :resource-type="modalResourceType"
      :institutions="state.institutions"
      :initial-name="initialModalName"
      :initial-institution-id="initialModalInstitutionId"
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { usePortfolio } from '@/composables/usePortfolio';
import type { Account, Institution } from '@/models/Portfolio';
import AccountHubStats from '@views/AccountHub/AccountHubStats.vue';
import AccountHubTable from '@views/AccountHub/AccountHubTable.vue';
import AddAccountModal from '@views/AccountHub/AddAccountModal.vue';
import DeleteConfirmModal from '@views/AccountHub/DeleteConfirmModal.vue';
import InstitutionsList from '@views/AccountHub/InstitutionsList.vue';

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

// Delete confirmation state
const deleteConfirmOpen = ref(false);
const deleteConfirmType = ref<'account' | 'institution'>('account');
const deleteConfirmId = ref(0);
const deleteConfirmName = ref('');

// Load portfolio on mount
onMounted(async () => {
  await loadPortfolio();
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

const handleSave = async (name: string, institutionId: number): Promise<void> => {
  try {
    if (modalResourceType.value === 'account') {
      if (modalType.value === 'create') {
        await createAccount(institutionId, name);
      } else if (editingItem.value && 'id' in editingItem.value) {
        await updateAccount(editingItem.value.id, name);
      }
    } else if (modalType.value === 'create') {
      await createInstitution(name);
    } else if (editingItem.value && 'id' in editingItem.value) {
      await updateInstitution(editingItem.value.id, name);
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
</script>

<style scoped src="@/styles/PortfolioView.css"></style>
