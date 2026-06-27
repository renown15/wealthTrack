import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useTaxHubModals } from '@composables/useTaxHubModals';
import type { EligibleAccount, TaxPeriod, TaxReturnUpsertRequest } from '@models/TaxModels';

const mockLoadFormData = vi.fn().mockResolvedValue(undefined);
const mockGetClosedStatusId = vi.fn().mockReturnValue(3);
const mockCreateClosedAccount = vi.fn();

vi.mock('@/composables/useQuickAddAccount', () => ({
  useQuickAddAccount: () => ({
    institutions: ref([]),
    accountTypes: ref([]),
    accountStatuses: ref([]),
    institutionTypes: ref([]),
    loadFormData: mockLoadFormData,
    getClosedStatusId: mockGetClosedStatusId,
    createClosedAccount: mockCreateClosedAccount,
  }),
}));

const makeAccount = (id = 10): EligibleAccount =>
  ({ accountId: id, accountName: 'HSBC Tax', taxYear: '2025/26', balance: '1200.00', documents: [] }) as never;

const makePeriod = (id = 1): TaxPeriod =>
  ({ id, name: '2025/26', startDate: '2025-04-06', endDate: '2026-04-05' }) as never;

const makeHandlers = (overrides: Partial<{
  selectedPeriodId: ReturnType<typeof ref<number | null>>;
  periods: ReturnType<typeof ref<TaxPeriod[]>>;
  accounts: ReturnType<typeof ref<EligibleAccount[]>>;
  saveReturn: (p: number, a: number, d: TaxReturnUpsertRequest) => Promise<boolean>;
  uploadDocument: (...args: unknown[]) => Promise<unknown>;
  downloadDocument: (...args: unknown[]) => Promise<void>;
  fetchDocumentBlob: (docId: number) => Promise<Blob | null>;
  deleteDocument: (...args: unknown[]) => Promise<void>;
  moveToInScope: (id: number) => Promise<void>;
  setScope: (id: number, scope: string | null, note: string | null) => Promise<void>;
}> = {}) => {
  const selectedPeriodId = overrides.selectedPeriodId ?? ref<number | null>(1);
  const periods = overrides.periods ?? ref<TaxPeriod[]>([makePeriod()]);
  const accounts = overrides.accounts ?? ref<EligibleAccount[]>([makeAccount()]);
  const saveReturn = overrides.saveReturn ?? vi.fn().mockResolvedValue(true);
  const uploadDocument = overrides.uploadDocument ?? vi.fn().mockResolvedValue(null);
  const downloadDocument = overrides.downloadDocument ?? vi.fn().mockResolvedValue(undefined);
  const fetchDocumentBlob = overrides.fetchDocumentBlob ?? vi.fn().mockResolvedValue(new Blob(['pdf']));
  const deleteDocument = overrides.deleteDocument ?? vi.fn().mockResolvedValue(undefined);
  const moveToInScope = overrides.moveToInScope ?? vi.fn().mockResolvedValue(undefined);
  const updateDocumentDescription = vi.fn().mockResolvedValue(undefined);
  const setScope = overrides.setScope ?? vi.fn().mockResolvedValue(undefined);
  return useTaxHubModals(
    selectedPeriodId, periods, accounts as never,
    saveReturn, uploadDocument as never, updateDocumentDescription as never, downloadDocument,
    fetchDocumentBlob, deleteDocument as never, moveToInScope, setScope,
  );
};

describe('useTaxHubModals — modals and document operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadFormData.mockResolvedValue(undefined);
    mockGetClosedStatusId.mockReturnValue(3);
  });

  it('openReturnModal sets activeAccount and opens modal', () => {
    const { openReturnModal, returnModalOpen, activeAccount } = makeHandlers();
    openReturnModal(makeAccount());
    expect(returnModalOpen.value).toBe(true);
    expect(activeAccount.value?.accountId).toBe(10);
  });

  it('openDocumentsModal sets activeAccount and opens docs modal', () => {
    const { openDocumentsModal, docsModalOpen, activeAccount } = makeHandlers();
    openDocumentsModal(makeAccount(20));
    expect(docsModalOpen.value).toBe(true);
    expect(activeAccount.value?.accountId).toBe(20);
  });

  it('openDeleteConfirm sets id, name and opens confirm', () => {
    const { openDeleteConfirm, deleteConfirmOpen, deleteConfirmId, deleteConfirmName } = makeHandlers();
    openDeleteConfirm(5, '2025/26');
    expect(deleteConfirmOpen.value).toBe(true);
    expect(deleteConfirmId.value).toBe(5);
    expect(deleteConfirmName.value).toBe('2025/26');
  });

  it('handleSaveReturn closes return modal on success', async () => {
    const { openReturnModal, handleSaveReturn, returnModalOpen } = makeHandlers();
    openReturnModal(makeAccount());
    await handleSaveReturn({ capitalGain: '1000', taxTakenOff: '200', income: '5000' } as never);
    expect(returnModalOpen.value).toBe(false);
  });

  it('handleSaveReturn does nothing when no activeAccount', async () => {
    const handlers = makeHandlers();
    await handlers.handleSaveReturn({} as never);
    expect(handlers.returnModalOpen.value).toBe(false);
  });

  it('openScopeModal sets activeAccount and opens scope modal', () => {
    const { openScopeModal, scopeModalOpen, activeAccount } = makeHandlers();
    openScopeModal(makeAccount(7));
    expect(scopeModalOpen.value).toBe(true);
    expect(activeAccount.value?.accountId).toBe(7);
  });

  it('handleSaveScope marks Out of Scope with note and closes', async () => {
    const setScope = vi.fn().mockResolvedValue(undefined);
    const { openScopeModal, handleSaveScope, scopeModalOpen } = makeHandlers({ setScope });
    openScopeModal(makeAccount(7));
    await handleSaveScope('reason');
    expect(setScope).toHaveBeenCalledWith(7, 'Out of Scope', 'reason');
    expect(scopeModalOpen.value).toBe(false);
  });

  it('handleClearScope clears with nulls', async () => {
    const setScope = vi.fn().mockResolvedValue(undefined);
    const { handleClearScope } = makeHandlers({ setScope });
    await handleClearScope(7);
    expect(setScope).toHaveBeenCalledWith(7, null, null);
  });

  it('handleSaveReturn does nothing when selectedPeriodId is null', async () => {
    const handlers = makeHandlers({ selectedPeriodId: ref(null) });
    handlers.openReturnModal(makeAccount());
    await handlers.handleSaveReturn({} as never);
    expect(handlers.returnModalOpen.value).toBe(true);
  });

  it('handleSaveReturn keeps modal open when saveReturn returns false', async () => {
    const saveReturn = vi.fn().mockResolvedValue(false);
    const { openReturnModal, handleSaveReturn, returnModalOpen } = makeHandlers({ saveReturn });
    openReturnModal(makeAccount());
    await handleSaveReturn({} as never);
    expect(returnModalOpen.value).toBe(true);
  });

  it('handleUpload calls uploadDocument with period and account', async () => {
    const uploadDocument = vi.fn().mockResolvedValue(null);
    const { openDocumentsModal, handleUpload } = makeHandlers({ uploadDocument });
    openDocumentsModal(makeAccount());
    const file = new File(['x'], 'doc.pdf');
    await handleUpload(file);
    expect(uploadDocument).toHaveBeenCalledWith(1, 10, file, undefined);
  });

  it('handleUpload does nothing when no activeAccount', async () => {
    const uploadDocument = vi.fn();
    const { handleUpload } = makeHandlers({ uploadDocument });
    await handleUpload(new File([], 'x.pdf'));
    expect(uploadDocument).not.toHaveBeenCalled();
  });

  it('handleDownload delegates to downloadDocument', async () => {
    const downloadDocument = vi.fn().mockResolvedValue(undefined);
    const { handleDownload } = makeHandlers({ downloadDocument });
    await handleDownload(7, 'file.pdf');
    expect(downloadDocument).toHaveBeenCalledWith(7, 'file.pdf');
  });

  it('handleDeleteDoc calls deleteDocument with period and account', async () => {
    const deleteDocument = vi.fn().mockResolvedValue(undefined);
    const { openDocumentsModal, handleDeleteDoc } = makeHandlers({ deleteDocument });
    openDocumentsModal(makeAccount());
    await handleDeleteDoc(99);
    expect(deleteDocument).toHaveBeenCalledWith(1, 10, 99);
  });

  it('handleDeleteDoc does nothing without activeAccount', async () => {
    const deleteDocument = vi.fn();
    const { handleDeleteDoc } = makeHandlers({ deleteDocument });
    await handleDeleteDoc(1);
    expect(deleteDocument).not.toHaveBeenCalled();
  });
});
