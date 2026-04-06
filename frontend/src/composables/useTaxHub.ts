/**
 * Composable for managing eligible accounts, tax returns, and documents in a period.
 */
import { ref } from 'vue';
import type { EligibleAccount, TaxDocument, TaxReturnUpsertRequest } from '@models/TaxModels';
import { taxService } from '@services/TaxService';
import { useToast } from '@composables/useToast';

export function useTaxHub() {
  const accounts = ref<EligibleAccount[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const { showError } = useToast();

  async function loadAccounts(periodId: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      accounts.value = await taxService.getEligibleAccounts(periodId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load accounts';
    } finally {
      loading.value = false;
    }
  }

  async function saveReturn(
    periodId: number,
    accountId: number,
    data: TaxReturnUpsertRequest,
  ): Promise<boolean> {
    try {
      const updated = await taxService.upsertReturn(periodId, accountId, data);
      const idx = accounts.value.findIndex((a) => a.accountId === accountId);
      if (idx !== -1) {
        accounts.value[idx] = { ...accounts.value[idx], taxReturn: updated };
      }
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save tax return';
      showError(msg);
      return false;
    }
  }

  async function uploadDocument(
    periodId: number,
    accountId: number,
    file: File,
  ): Promise<TaxDocument | null> {
    try {
      const doc = await taxService.uploadDocument(periodId, accountId, file);
      const idx = accounts.value.findIndex((a) => a.accountId === accountId);
      if (idx !== -1) {
        accounts.value[idx] = {
          ...accounts.value[idx],
          documents: [...accounts.value[idx].documents, doc],
        };
      }
      return doc;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload document';
      showError(msg);
      return null;
    }
  }

  async function downloadDocument(docId: number, filename: string): Promise<void> {
    try {
      const blob = await taxService.downloadDocument(docId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to download document';
      showError(msg);
    }
  }

  async function deleteDocument(_periodId: number, accountId: number, docId: number): Promise<void> {
    try {
      await taxService.deleteDocument(docId);
      const idx = accounts.value.findIndex((a) => a.accountId === accountId);
      if (idx !== -1) {
        accounts.value[idx] = {
          ...accounts.value[idx],
          documents: accounts.value[idx].documents.filter((d) => d.id !== docId),
        };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete document';
      showError(msg);
    }
  }

  return {
    accounts,
    loading,
    error,
    loadAccounts,
    saveReturn,
    uploadDocument,
    downloadDocument,
    deleteDocument,
  };
}
