/**
 * Composable for managing eligible accounts, tax returns, and documents in a period.
 */
import { ref, computed } from 'vue';
import type { EligibleAccount, TaxDocument, TaxReturnUpsertRequest } from '@models/TaxModels';
import { apiService } from '@services/ApiService';
import { useToast } from '@composables/useToast';

export function useTaxHub() {
  const inScope = ref<EligibleAccount[]>([]);
  const eligible = ref<EligibleAccount[]>([]);
  const accountGroupId = ref<number | null>(null);
  const currentPeriodId = ref<number | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const { showError } = useToast();

  const accounts = computed(() => [...inScope.value, ...eligible.value]);

  async function loadAccounts(periodId: number): Promise<void> {
    currentPeriodId.value = periodId;
    loading.value = true;
    error.value = null;
    try {
      const result = await apiService.getTaxEligibleAccounts(periodId);
      inScope.value = result.inScope;
      eligible.value = result.eligible;
      accountGroupId.value = result.accountGroupId;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load accounts';
    } finally {
      loading.value = false;
    }
  }

  function updateAccount(accountId: number, updater: (a: EligibleAccount) => EligibleAccount): void {
    const si = inScope.value.findIndex((a) => a.accountId === accountId);
    if (si !== -1) { inScope.value.splice(si, 1, updater(inScope.value[si])); return; }
    const ei = eligible.value.findIndex((a) => a.accountId === accountId);
    if (ei !== -1) { eligible.value.splice(ei, 1, updater(eligible.value[ei])); }
  }

  async function saveReturn(
    periodId: number,
    accountId: number,
    data: TaxReturnUpsertRequest,
  ): Promise<boolean> {
    try {
      const updated = await apiService.upsertTaxReturn(periodId, accountId, data);
      updateAccount(accountId, (a) => ({ ...a, taxReturn: updated }));
      return true;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save tax return');
      return false;
    }
  }

  async function uploadDocument(
    periodId: number,
    accountId: number,
    file: File,
  ): Promise<TaxDocument | null> {
    try {
      const doc = await apiService.uploadTaxDocument(periodId, accountId, file);
      updateAccount(accountId, (a) => ({ ...a, documents: [...a.documents, doc] }));
      return doc;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to upload document');
      return null;
    }
  }

  async function downloadDocument(docId: number, filename: string): Promise<void> {
    try {
      const blob = await apiService.downloadTaxDocument(docId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to download document');
    }
  }

  async function fetchDocumentBlob(docId: number): Promise<Blob | null> {
    try {
      return await apiService.downloadTaxDocument(docId);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load document');
      return null;
    }
  }

  async function deleteDocument(_periodId: number, accountId: number, docId: number): Promise<void> {
    try {
      await apiService.deleteTaxDocument(docId);
      updateAccount(accountId, (a) => ({ ...a, documents: a.documents.filter((d) => d.id !== docId) }));
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  }

  async function moveToInScope(accountId: number): Promise<void> {
    if (!accountGroupId.value || currentPeriodId.value === null) return;
    try {
      await apiService.addAccountToGroup(accountGroupId.value, accountId);
      await loadAccounts(currentPeriodId.value);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to add account to scope');
    }
  }

  async function moveToEligible(accountId: number): Promise<void> {
    if (!accountGroupId.value || currentPeriodId.value === null) return;
    try {
      await apiService.removeAccountFromGroup(accountGroupId.value, accountId);
      await loadAccounts(currentPeriodId.value);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to remove account from scope');
    }
  }

  return {
    accounts,
    inScope,
    eligible,
    accountGroupId,
    loading,
    error,
    loadAccounts,
    saveReturn,
    uploadDocument,
    downloadDocument,
    fetchDocumentBlob,
    deleteDocument,
    moveToInScope,
    moveToEligible,
  };
}
