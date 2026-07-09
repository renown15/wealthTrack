import { ref, type Ref } from 'vue';
import type { Account, PortfolioItem } from '@models/WealthTrackDataModels';
import type { SavePayload } from '@views/AccountHub/accountModalSave';
import { useToast } from '@composables/useToast';

export interface UseOutgoingsHubModalsDeps {
  createAccount: (payload: SavePayload) => Promise<Account | null>;
  updateAccount: (accountId: number, payload: SavePayload) => Promise<boolean>;
  deleteAccount: (accountId: number) => Promise<boolean>;
  error: Ref<string | null>;
}

export interface UseOutgoingsHubModalsReturn {
  accountModalOpen: Ref<boolean>;
  modalType: Ref<'create' | 'edit'>;
  editingItem: Ref<PortfolioItem | null>;
  deleteConfirmOpen: Ref<boolean>;
  deleteConfirmName: Ref<string>;
  docsModalOpen: Ref<boolean>;
  docsAccountId: Ref<number>;
  docsAccountName: Ref<string>;
  actualsModalOpen: Ref<boolean>;
  actualsAccountId: Ref<number>;
  actualsAccountName: Ref<string>;
  openCreate: () => void;
  openEdit: (item: PortfolioItem) => void;
  closeAccountModal: () => void;
  openDeleteConfirm: (item: PortfolioItem) => void;
  openDocs: (accountId: number, accountName: string) => void;
  openActuals: (item: PortfolioItem) => void;
  handleSave: (payload: SavePayload) => Promise<void>;
  handleConfirmDelete: () => Promise<void>;
}

/**
 * Modal state + save/delete handlers for the Outgoings Hub. The account CRUD
 * functions are injected (composables like useOutgoings are not singletons —
 * calling it here would create a separate state instance from the hub's).
 */
export function useOutgoingsHubModals(deps: UseOutgoingsHubModalsDeps): UseOutgoingsHubModalsReturn {
  const { showSuccess, showError } = useToast();

  const accountModalOpen = ref(false);
  const modalType = ref<'create' | 'edit'>('create');
  const editingItem = ref<PortfolioItem | null>(null);
  const deleteConfirmOpen = ref(false);
  const deleteConfirmId = ref(0);
  const deleteConfirmName = ref('');
  const docsModalOpen = ref(false);
  const docsAccountId = ref(0);
  const docsAccountName = ref('');
  const actualsModalOpen = ref(false);
  const actualsAccountId = ref(0);
  const actualsAccountName = ref('');

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

  function openActuals(item: PortfolioItem): void {
    actualsAccountId.value = item.account.id;
    actualsAccountName.value = item.account.name;
    actualsModalOpen.value = true;
  }

  async function handleSave(payload: SavePayload): Promise<void> {
    const item = editingItem.value;
    if (item) {
      const ok = await deps.updateAccount(item.account.id, payload);
      if (ok) { showSuccess('Account updated'); closeAccountModal(); }
      else showError(deps.error.value ?? 'Update failed');
    } else {
      const acc = await deps.createAccount(payload);
      if (acc) { showSuccess('Account added'); closeAccountModal(); }
      else showError(deps.error.value ?? 'Create failed');
    }
  }

  async function handleConfirmDelete(): Promise<void> {
    deleteConfirmOpen.value = false;
    const ok = await deps.deleteAccount(deleteConfirmId.value);
    if (ok) showSuccess('Account deleted');
    else showError(deps.error.value ?? 'Delete failed');
  }

  return {
    accountModalOpen, modalType, editingItem,
    deleteConfirmOpen, deleteConfirmName,
    docsModalOpen, docsAccountId, docsAccountName,
    actualsModalOpen, actualsAccountId, actualsAccountName,
    openCreate, openEdit, closeAccountModal,
    openDeleteConfirm, openDocs, openActuals, handleSave, handleConfirmDelete,
  };
}
