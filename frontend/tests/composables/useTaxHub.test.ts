import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTaxHub } from '@composables/useTaxHub';
import { apiService } from '@services/ApiService';
import type { EligibleAccount, TaxDocument, TaxReturn } from '@models/TaxModels';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    getTaxEligibleAccounts: vi.fn(),
    upsertTaxReturn: vi.fn(),
    uploadTaxDocument: vi.fn(),
    downloadTaxDocument: vi.fn(),
    deleteTaxDocument: vi.fn(),
  },
}));

vi.mock('@composables/useToast', () => ({
  useToast: () => ({ showSuccess: vi.fn(), showError: vi.fn() }),
}));

const mockApi = vi.mocked(apiService);

const mockReturn: TaxReturn = {
  id: 10, accountId: 5, taxPeriodId: 1,
  income: 100, capitalGain: null, taxTakenOff: 20,
  createdAt: '2024-04-06T00:00:00', updatedAt: '2024-04-06T00:00:00',
};

const mockDoc: TaxDocument = {
  id: 20, taxReturnId: 10, filename: 'cert.pdf',
  contentType: 'application/pdf', createdAt: '2024-04-06T00:00:00',
};

const mockAccount: EligibleAccount = {
  accountId: 5, accountName: 'Savings', accountType: 'Savings Account',
  institutionName: 'TestBank', interestRate: '2.0',
  eligibilityReason: 'interest_bearing', taxReturn: null, documents: [],
};

describe('useTaxHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getTaxEligibleAccounts.mockResolvedValue([mockAccount]);
    mockApi.upsertTaxReturn.mockResolvedValue(mockReturn);
    mockApi.uploadTaxDocument.mockResolvedValue(mockDoc);
    mockApi.downloadTaxDocument.mockResolvedValue(new Blob(['data']));
    mockApi.deleteTaxDocument.mockResolvedValue(undefined);
  });

  it('loadAccounts populates accounts', async () => {
    const { accounts, loadAccounts } = useTaxHub();
    await loadAccounts(1);
    expect(accounts.value).toStrictEqual([mockAccount]);
  });

  it('loadAccounts sets error on failure', async () => {
    mockApi.getTaxEligibleAccounts.mockRejectedValue(new Error('Network'));
    const { error, loadAccounts } = useTaxHub();
    await loadAccounts(1);
    expect(error.value).toBe('Network');
  });

  it('saveReturn updates account taxReturn in list', async () => {
    const { accounts, loadAccounts, saveReturn } = useTaxHub();
    await loadAccounts(1);
    const ok = await saveReturn(1, 5, { income: 100, capitalGain: null, taxTakenOff: 20 });
    expect(ok).toBe(true);
    expect(accounts.value[0].taxReturn).toStrictEqual(mockReturn);
  });

  it('saveReturn returns false on error', async () => {
    mockApi.upsertTaxReturn.mockRejectedValue(new Error('Save failed'));
    const { loadAccounts, saveReturn } = useTaxHub();
    await loadAccounts(1);
    const ok = await saveReturn(1, 5, { income: 100, capitalGain: null, taxTakenOff: 0 });
    expect(ok).toBe(false);
  });

  it('uploadDocument appends doc to account', async () => {
    const { accounts, loadAccounts, uploadDocument } = useTaxHub();
    await loadAccounts(1);
    const file = new File(['content'], 'cert.pdf', { type: 'application/pdf' });
    const result = await uploadDocument(1, 5, file);
    expect(result).toStrictEqual(mockDoc);
    expect(accounts.value[0].documents).toHaveLength(1);
    expect(accounts.value[0].documents[0].id).toBe(20);
  });

  it('uploadDocument returns null on error', async () => {
    mockApi.uploadTaxDocument.mockRejectedValue(new Error('Upload failed'));
    const { loadAccounts, uploadDocument } = useTaxHub();
    await loadAccounts(1);
    const file = new File(['content'], 'cert.pdf');
    const result = await uploadDocument(1, 5, file);
    expect(result).toBeNull();
  });

  it('deleteDocument removes doc from account', async () => {
    const accountWithDoc: EligibleAccount = { ...mockAccount, documents: [mockDoc] };
    mockApi.getTaxEligibleAccounts.mockResolvedValue([accountWithDoc]);
    const { accounts, loadAccounts, deleteDocument } = useTaxHub();
    await loadAccounts(1);
    await deleteDocument(1, 5, 20);
    expect(accounts.value[0].documents).toHaveLength(0);
  });
});
