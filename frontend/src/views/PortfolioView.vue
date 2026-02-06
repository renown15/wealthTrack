<template>
  <div class="portfolio-view">
    <!-- Header -->
    <header class="portfolio-header">
      <div class="header-content">
        <h1>Portfolio Dashboard</h1>
        <div class="header-stats">
          <div class="stat">
            <span class="stat-label">Total Value</span>
            <span class="stat-value">{{ formatCurrency(totalValue) }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Accounts</span>
            <span class="stat-value">{{ accountCount }}</span>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <button class="btn btn-primary" @click="openCreateAccountModal">+ New Account</button>
        <button class="btn btn-secondary" @click="openCreateInstitutionModal">
          + New Institution
        </button>
      </div>
    </header>

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
      <!-- Accounts Grid -->
      <section class="accounts-section">
        <h2>Accounts</h2>
        <div class="accounts-grid">
          <article v-for="item in state.items" :key="item.account.id" class="account-card">
            <header class="account-header">
              <h3>{{ item.account.name }}</h3>
              <div class="account-actions">
                <button
                  class="btn-icon edit"
                  @click="openEditAccountModal(item.account)"
                  title="Edit account"
                >
                  ✎
                </button>
                <button
                  class="btn-icon delete"
                  @click="openDeleteConfirm('account', item.account.id, item.account.name)"
                  title="Delete account"
                >
                  ✕
                </button>
              </div>
            </header>

            <div class="account-body">
              <div class="account-info">
                <span class="label">Institution</span>
                <span class="value">{{ item.institution?.name || 'None' }}</span>
              </div>

              <div class="account-info">
                <span class="label">Balance</span>
                <span class="value balance">{{ formatCurrency(item.latestBalance?.value) }}</span>
              </div>

              <div class="account-info">
                <span class="label">Last Updated</span>
                <span class="value">{{
                  item.latestBalance?.createdAt
                    ? formatDate(item.latestBalance.createdAt)
                    : 'Never'
                }}</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- Institutions List -->
      <section v-if="state.institutions.length > 0" class="institutions-section">
        <h2>Institutions</h2>
        <div class="institutions-list">
          <div v-for="institution in state.institutions" :key="institution.id" class="institution-item">
            <span class="institution-name">{{ institution.name }}</span>
            <div class="institution-actions">
              <button
                class="btn-icon edit"
                @click="openEditInstitutionModal(institution)"
                title="Edit institution"
              >
                ✎
              </button>
              <button
                class="btn-icon delete"
                @click="openDeleteConfirm('institution', institution.id, institution.name)"
                title="Delete institution"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content" @click.stop>
        <header class="modal-header">
          <h2>
            {{ modalType === 'create' ? 'New' : 'Edit' }}
            {{ modalResourceType === 'account' ? 'Account' : 'Institution' }}
          </h2>
          <button class="btn-close" @click="closeModal">×</button>
        </header>

        <div class="modal-body">
          <div class="form-group">
            <label :for="`${modalResourceType}-name`">
              {{ modalResourceType === 'account' ? 'Account' : 'Institution' }} Name
            </label>
            <input
              :id="`${modalResourceType}-name`"
              v-model="formData.name"
              type="text"
              :placeholder="
                modalResourceType === 'account'
                  ? 'e.g., Checking, Savings'
                  : 'e.g., Chase Bank, Wells Fargo'
              "
            />
          </div>

          <div v-if="modalResourceType === 'account' && modalType === 'create'" class="form-group">
            <label for="institution-select">Institution</label>
            <select v-model.number="formData.institutionid" id="institution-select">
              <option value="">Select Institution</option>
              <option v-for="inst in state.institutions" :key="inst.id" :value="inst.id">
                {{ inst.name }}
              </option>
            </select>
          </div>
        </div>

        <footer class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">Cancel</button>
          <button class="btn btn-primary" @click="handleSave">
            {{ modalType === 'create' ? 'Create' : 'Save' }}
          </button>
        </footer>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="deleteConfirmOpen" class="modal-overlay" @click.self="closeDeleteConfirm">
      <div class="modal-content" @click.stop>
        <header class="modal-header">
          <h2>Confirm Delete</h2>
          <button class="btn-close" @click="closeDeleteConfirm">×</button>
        </header>

        <div class="modal-body">
          <p>
            Are you sure you want to delete <strong>{{ deleteConfirmName }}</strong>? This action
            cannot be undone.
          </p>
        </div>

        <footer class="modal-footer">
          <button class="btn btn-secondary" @click="closeDeleteConfirm">Cancel</button>
          <button class="btn btn-danger" @click="handleConfirmDelete">Delete</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePortfolio } from '@/composables/usePortfolio';
import type { Account, Institution } from '@/models/Portfolio';

const { state, totalValue, accountCount, loadPortfolio, createAccount, updateAccount, deleteAccount, createInstitution, updateInstitution, deleteInstitution, clearError } = usePortfolio();

// Modal state
const modalOpen = ref(false);
const modalType = ref<'create' | 'edit'>('create');
const modalResourceType = ref<'account' | 'institution'>('account');
const formData = ref({ name: '', institutionid: 0 });
const editingItem = ref<Account | Institution | null>(null);

// Delete confirmation state
const deleteConfirmOpen = ref(false);
const deleteConfirmType = ref<'account' | 'institution'>('account');
const deleteConfirmId = ref(0);
const deleteConfirmName = ref('');

// Load portfolio on mount
onMounted(async () => {
  await loadPortfolio();
});

const formatCurrency = (value?: string | number): string => {
  if (!value) return '$0.00';
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  } catch {
    return '$0.00';
  }
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString();
};

const openCreateAccountModal = (): void => {
  modalType.value = 'create';
  modalResourceType.value = 'account';
  formData.value = { name: '', institutionid: 0 };
  editingItem.value = null;
  modalOpen.value = true;
};

const openCreateInstitutionModal = (): void => {
  modalType.value = 'create';
  modalResourceType.value = 'institution';
  formData.value = { name: '', institutionid: 0 };
  editingItem.value = null;
  modalOpen.value = true;
};

const openEditAccountModal = (account: Account): void => {
  modalType.value = 'edit';
  modalResourceType.value = 'account';
  formData.value = { name: account.name, institutionid: 0 };
  editingItem.value = account;
  modalOpen.value = true;
};

const openEditInstitutionModal = (institution: Institution): void => {
  modalType.value = 'edit';
  modalResourceType.value = 'institution';
  formData.value = { name: institution.name, institutionid: 0 };
  editingItem.value = institution;
  modalOpen.value = true;
};

const closeModal = (): void => {
  modalOpen.value = false;
  formData.value = { name: '', institutionid: 0 };
  editingItem.value = null;
};

const handleSave = async (): Promise<void> => {
  try {
    if (modalResourceType.value === 'account') {
      if (modalType.value === 'create') {
        if (!formData.value.name || !formData.value.institutionid) {
          state.error = 'Please fill in all required fields';
          return;
        }
        await createAccount(formData.value.institutionid, formData.value.name);
      } else if (modalType.value === 'edit' && editingItem.value && 'id' in editingItem.value) {
        await updateAccount(editingItem.value.id, formData.value.name);
      }
    } else if (modalResourceType.value === 'institution') {
      if (!formData.value.name) {
        state.error = 'Institution name is required';
        return;
      }

      if (modalType.value === 'create') {
        await createInstitution(formData.value.name);
      } else if (modalType.value === 'edit' && editingItem.value && 'id' in editingItem.value) {
        await updateInstitution(editingItem.value.id, formData.value.name);
      }
    }

    closeModal();
  } catch (error) {
    // Error already set in state by the composable
  }
};

const openDeleteConfirm = (
  type: 'account' | 'institution',
  id: number,
  name: string,
): void => {
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
