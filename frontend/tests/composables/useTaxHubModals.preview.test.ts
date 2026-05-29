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

describe('useTaxHubModals — quickAdd and preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadFormData.mockResolvedValue(undefined);
    mockGetClosedStatusId.mockReturnValue(3);
  });

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

  it('handlePreview sets preview state when blob is returned', async () => {
    URL.createObjectURL = vi.fn().mockReturnValue('blob:url');
    URL.revokeObjectURL = vi.fn();
    const { handlePreview, previewOpen, previewFilename, previewContentType } = makeHandlers({
      fetchDocumentBlob: vi.fn().mockResolvedValue(new Blob(['pdf'])),
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
