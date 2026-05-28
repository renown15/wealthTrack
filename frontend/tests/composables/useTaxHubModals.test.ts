import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import { useTaxHubModals } from '@composables/useTaxHubModals';
import type { EligibleAccount, TaxPeriod, TaxReturnUpsertRequest } from '@models/TaxModels';

// ── mock useQuickAddAccount ───────────────────────────────────────────────────

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

// ── fixtures ──────────────────────────────────────────────────────────────────

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
  return useTaxHubModals(
    selectedPeriodId, periods, accounts as never,
    saveReturn, uploadDocument as never, downloadDocument,
    fetchDocumentBlob, deleteDocument as never, moveToInScope,
  );
};

describe('useTaxHubModals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadFormData.mockResolvedValue(undefined);
    mockGetClosedStatusId.mockReturnValue(3);
  });

  // ── openReturnModal / openDocumentsModal / openDeleteConfirm ───────────────

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

  // ── handleSaveReturn ──────────────────────────────────────────────────────

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

  // ── handleUpload ──────────────────────────────────────────────────────────

  it('handleUpload calls uploadDocument with period and account', async () => {
    const uploadDocument = vi.fn().mockResolvedValue(null);
    const { openDocumentsModal, handleUpload } = makeHandlers({ uploadDocument });
    openDocumentsModal(makeAccount());
    const file = new File(['x'], 'doc.pdf');
    await handleUpload(file);
    expect(uploadDocument).toHaveBeenCalledWith(1, 10, file);
  });

  it('handleUpload does nothing when no activeAccount', async () => {
    const uploadDocument = vi.fn();
    const { handleUpload } = makeHandlers({ uploadDocument });
    await handleUpload(new File([], 'x.pdf'));
    expect(uploadDocument).not.toHaveBeenCalled();
  });

  // ── handleDownload ────────────────────────────────────────────────────────

  it('handleDownload delegates to downloadDocument', async () => {
    const downloadDocument = vi.fn().mockResolvedValue(undefined);
    const { handleDownload } = makeHandlers({ downloadDocument });
    await handleDownload(7, 'file.pdf');
    expect(downloadDocument).toHaveBeenCalledWith(7, 'file.pdf');
  });

  // ── handleDeleteDoc ───────────────────────────────────────────────────────

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

  // ── handleOpenQuickAdd ────────────────────────────────────────────────────

  it('handleOpenQuickAdd loads form data and opens quick add', async () => {
    const { handleOpenQuickAdd, quickAddOpen } = makeHandlers();
    await handleOpenQuickAdd();
    expect(mockLoadFormData).toHaveBeenCalled();
    expect(quickAddOpen.value).toBe(true);
  });

  it('handleOpenQuickAdd uses period endDate in initial data', async () => {
    const { handleOpenQuickAdd, quickAddInitialData } = makeHandlers();
    await handleOpenQuickAdd();
    expect(quickAddInitialData.value.closedAt).toBe('2026-04-05');
  });

  // ── handleQuickAdd ────────────────────────────────────────────────────────

  it('handleQuickAdd creates account, moves to in scope, opens docs modal', async () => {
    mockCreateClosedAccount.mockResolvedValue(10);
    const moveToInScope = vi.fn().mockResolvedValue(undefined);
    const { handleQuickAdd, quickAddOpen, docsModalOpen } = makeHandlers({ moveToInScope });
    await handleQuickAdd({ name: 'Tax Acc' } as never);
    expect(moveToInScope).toHaveBeenCalledWith(10);
    expect(quickAddOpen.value).toBe(false);
    expect(docsModalOpen.value).toBe(true);
  });

  it('handleQuickAdd does nothing when selectedPeriodId is null', async () => {
    const { handleQuickAdd, quickAddOpen } = makeHandlers({ selectedPeriodId: ref(null) });
    await handleQuickAdd({} as never);
    expect(quickAddOpen.value).toBe(false);
  });

  it('handleQuickAdd does nothing when createClosedAccount returns null', async () => {
    mockCreateClosedAccount.mockResolvedValue(null);
    const moveToInScope = vi.fn();
    const { handleQuickAdd } = makeHandlers({ moveToInScope });
    await handleQuickAdd({} as never);
    expect(moveToInScope).not.toHaveBeenCalled();
  });

  // ── handlePreview / closePreview ──────────────────────────────────────────

  it('handlePreview sets preview state when blob is returned', async () => {
    const blob = new Blob(['pdf']);
    URL.createObjectURL = vi.fn().mockReturnValue('blob:url');
    URL.revokeObjectURL = vi.fn();
    const { handlePreview, previewOpen, previewFilename, previewContentType } = makeHandlers({
      fetchDocumentBlob: vi.fn().mockResolvedValue(blob),
    });
    await handlePreview(1, 'doc.pdf', 'application/pdf');
    expect(previewOpen.value).toBe(true);
    expect(previewFilename.value).toBe('doc.pdf');
    expect(previewContentType.value).toBe('application/pdf');
  });

  it('handlePreview does nothing when blob is null', async () => {
    const { handlePreview, previewOpen } = makeHandlers({
      fetchDocumentBlob: vi.fn().mockResolvedValue(null),
    });
    await handlePreview(1, 'doc.pdf', null);
    expect(previewOpen.value).toBe(false);
  });

  it('closePreview clears preview state', async () => {
    URL.createObjectURL = vi.fn().mockReturnValue('blob:url');
    URL.revokeObjectURL = vi.fn();
    const { handlePreview, closePreview, previewOpen } = makeHandlers({
      fetchDocumentBlob: vi.fn().mockResolvedValue(new Blob(['x'])),
    });
    await handlePreview(1, 'doc.pdf', null);
    closePreview();
    expect(previewOpen.value).toBe(false);
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});
