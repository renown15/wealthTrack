/**
 * Composable for modal state and handlers in the Tax Hub.
 */
import { ref } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import type { EligibleAccount, TaxDocument, TaxPeriod, TaxReturnUpsertRequest } from '@models/TaxModels';
import type { AccountFormData } from '@views/AccountHub/addAccountModalValidation';
import type { Institution } from '@models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@models/ReferenceData';
import { useQuickAddAccount } from '@composables/useQuickAddAccount';

export function useTaxHubModals(
  selectedPeriodId: Ref<number | null>,
  periods: Ref<TaxPeriod[]>,
  accounts: ComputedRef<EligibleAccount[]> | Ref<EligibleAccount[]>,
  saveReturn: (periodId: number, accountId: number, data: TaxReturnUpsertRequest) => Promise<boolean>,
  uploadDocument: (periodId: number, accountId: number, file: File) => Promise<TaxDocument | null>,
  downloadDocument: (docId: number, filename: string) => Promise<void>,
  fetchDocumentBlob: (docId: number) => Promise<Blob | null>,
  deleteDocument: (periodId: number, accountId: number, docId: number) => Promise<void>,
  moveToInScope: (accountId: number) => Promise<void>,
): {
  returnModalOpen: Ref<boolean>;
  docsModalOpen: Ref<boolean>;
  quickAddOpen: Ref<boolean>;
  activeAccount: Ref<EligibleAccount | null>;
  deleteConfirmOpen: Ref<boolean>;
  deleteConfirmId: Ref<number>;
  deleteConfirmName: Ref<string>;
  quickAddInitialData: Ref<Partial<AccountFormData>>;
  quickAddInstitutions: Ref<Institution[]>;
  quickAddTypes: Ref<ReferenceDataItem[]>;
  quickAddStatuses: Ref<ReferenceDataItem[]>;
  quickAddInstitutionTypes: Ref<ReferenceDataItem[]>;
  previewOpen: Ref<boolean>;
  previewUrl: Ref<string | null>;
  previewFilename: Ref<string>;
  previewContentType: Ref<string | null>;
  openReturnModal: (account: EligibleAccount) => void;
  openDocumentsModal: (account: EligibleAccount) => void;
  openDeleteConfirm: (periodId: number, periodName: string) => void;
  handleSaveReturn: (data: TaxReturnUpsertRequest) => Promise<void>;
  handleUpload: (file: File) => Promise<void>;
  handleDownload: (docId: number, filename: string) => Promise<void>;
  handleDeleteDoc: (docId: number) => Promise<void>;
  handleOpenQuickAdd: () => Promise<void>;
  handleQuickAdd: (data: AccountFormData) => Promise<void>;
  handlePreview: (docId: number, filename: string, contentType: string | null) => Promise<void>;
  closePreview: () => void;
} {
  const returnModalOpen = ref(false);
  const docsModalOpen = ref(false);
  const quickAddOpen = ref(false);
  const activeAccount = ref<EligibleAccount | null>(null);
  const deleteConfirmOpen = ref(false);
  const deleteConfirmId = ref(0);
  const deleteConfirmName = ref('');
  const quickAddInitialData = ref<Partial<AccountFormData>>({});
  const previewOpen = ref(false);
  const previewUrl = ref<string | null>(null);
  const previewFilename = ref('');
  const previewContentType = ref<string | null>(null);

  const {
    institutions: quickAddInstitutions,
    accountTypes: quickAddTypes,
    accountStatuses: quickAddStatuses,
    institutionTypes: quickAddInstitutionTypes,
    loadFormData,
    getClosedStatusId,
    createClosedAccount,
  } = useQuickAddAccount();

  function openReturnModal(account: EligibleAccount): void {
    activeAccount.value = account;
    returnModalOpen.value = true;
  }

  function openDocumentsModal(account: EligibleAccount): void {
    activeAccount.value = account;
    docsModalOpen.value = true;
  }

  function openDeleteConfirm(periodId: number, periodName: string): void {
    deleteConfirmId.value = periodId;
    deleteConfirmName.value = periodName;
    deleteConfirmOpen.value = true;
  }

  async function handleSaveReturn(data: TaxReturnUpsertRequest): Promise<void> {
    if (!activeAccount.value || selectedPeriodId.value === null) return;
    const accountId = activeAccount.value.accountId;
    const ok = await saveReturn(selectedPeriodId.value, accountId, data);
    if (ok) {
      activeAccount.value = accounts.value.find((a) => a.accountId === accountId) ?? activeAccount.value;
      returnModalOpen.value = false;
    }
  }

  async function handleUpload(file: File): Promise<void> {
    if (!activeAccount.value || selectedPeriodId.value === null) return;
    await uploadDocument(selectedPeriodId.value, activeAccount.value.accountId, file);
    activeAccount.value =
      accounts.value.find((a) => a.accountId === activeAccount.value?.accountId) ?? activeAccount.value;
  }

  async function handleDownload(docId: number, filename: string): Promise<void> {
    await downloadDocument(docId, filename);
  }

  async function handlePreview(docId: number, filename: string, contentType: string | null): Promise<void> {
    const blob = await fetchDocumentBlob(docId);
    if (!blob) return;
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = URL.createObjectURL(blob);
    previewFilename.value = filename;
    previewContentType.value = contentType;
    previewOpen.value = true;
  }

  function closePreview(): void {
    previewOpen.value = false;
    if (previewUrl.value) { URL.revokeObjectURL(previewUrl.value); previewUrl.value = null; }
    previewFilename.value = '';
    previewContentType.value = null;
  }

  async function handleDeleteDoc(docId: number): Promise<void> {
    if (!activeAccount.value || selectedPeriodId.value === null) return;
    await deleteDocument(selectedPeriodId.value, activeAccount.value.accountId, docId);
    activeAccount.value =
      accounts.value.find((a) => a.accountId === activeAccount.value?.accountId) ?? activeAccount.value;
  }

  async function handleOpenQuickAdd(): Promise<void> {
    await loadFormData();
    const closedStatusId = getClosedStatusId();
    const selectedPeriod = periods.value.find((p) => p.id === selectedPeriodId.value);
    quickAddInitialData.value = {
      ...(closedStatusId ? { statusId: closedStatusId } : {}),
      openedAt: '',
      closedAt: selectedPeriod?.endDate ?? '',
    };
    quickAddOpen.value = true;
  }

  async function handleQuickAdd(data: AccountFormData): Promise<void> {
    if (selectedPeriodId.value === null) return;
    const id = await createClosedAccount(data);
    if (!id) return;
    await moveToInScope(id);
    quickAddOpen.value = false;
    const acct = accounts.value.find((a) => a.accountId === id) ?? null;
    if (acct) { activeAccount.value = acct; docsModalOpen.value = true; }
  }

  return {
    returnModalOpen, docsModalOpen, quickAddOpen,
    activeAccount, deleteConfirmOpen, deleteConfirmId, deleteConfirmName,
    quickAddInitialData, quickAddInstitutions, quickAddTypes,
    quickAddStatuses, quickAddInstitutionTypes,
    previewOpen, previewUrl, previewFilename, previewContentType,
    openReturnModal, openDocumentsModal, openDeleteConfirm,
    handleSaveReturn, handleUpload, handleDownload, handleDeleteDoc,
    handleOpenQuickAdd, handleQuickAdd, handlePreview, closePreview,
  };
}
