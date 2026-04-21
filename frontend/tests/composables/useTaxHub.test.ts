import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTaxHub } from '@composables/useTaxHub';
import { apiService } from '@services/ApiService';
import type { EligibleAccount, TaxDocument, TaxPeriodAccountsResponse, TaxReturn } from '@models/TaxModels';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    getTaxEligibleAccounts: vi.fn(),
    upsertTaxReturn: vi.fn(),
    uploadTaxDocument: vi.fn(),
    downloadTaxDocument: vi.fn(),
    deleteTaxDocument: vi.fn(),
    addAccountToGroup: vi.fn(),
    removeAccountFromGroup: vi.fn(),
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
  institutionName: 'TestBank', interestRate: '2.0', accountStatus: 'Open',
  accountNumber: null, sortCode: null, rollRefNumber: null,
  eligibilityReason: 'interest_bearing', eventCount: 0, taxReturn: null, documents: [],
};

const mockInScopeAccount: EligibleAccount = {
  ...mockAccount, accountId: 9, accountName: 'Closed ISA', eligibilityReason: 'in_scope',
};

const mockResponse: TaxPeriodAccountsResponse = {
  accountGroupId: 42,
  inScope: [mockInScopeAccount],
  eligible: [mockAccount],
};

describe('useTaxHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getTaxEligibleAccounts.mockResolvedValue(mockResponse);
    mockApi.upsertTaxReturn.mockResolvedValue(mockReturn);
    mockApi.uploadTaxDocument.mockResolvedValue(mockDoc);
    mockApi.downloadTaxDocument.mockResolvedValue(new Blob(['data']));
    mockApi.deleteTaxDocument.mockResolvedValue(undefined);
    mockApi.addAccountToGroup.mockResolvedValue(undefined);
    mockApi.removeAccountFromGroup.mockResolvedValue(undefined);
  });

  it('loadAccounts populates inScope and eligible', async () => {
    const { inScope, eligible, loadAccounts } = useTaxHub();
    await loadAccounts(1);
    expect(inScope.value).toStrictEqual([mockInScopeAccount]);
    expect(eligible.value).toStrictEqual([mockAccount]);
  });

  it('accounts computed combines inScope and eligible', async () => {
    const { accounts, loadAccounts } = useTaxHub();
    await loadAccounts(1);
    expect(accounts.value).toHaveLength(2);
  });

  it('loadAccounts stores accountGroupId', async () => {
    const { accountGroupId, loadAccounts } = useTaxHub();
    await loadAccounts(1);
    expect(accountGroupId.value).toBe(42);
  });

  it('loadAccounts sets error on failure', async () => {
    mockApi.getTaxEligibleAccounts.mockRejectedValue(new Error('Network'));
    const { error, loadAccounts } = useTaxHub();
    await loadAccounts(1);
    expect(error.value).toBe('Network');
  });

  it('saveReturn updates account taxReturn in eligible list', async () => {
    const { eligible, loadAccounts, saveReturn } = useTaxHub();
    await loadAccounts(1);
    const ok = await saveReturn(1, 5, { income: 100, capitalGain: null, taxTakenOff: 20 });
    expect(ok).toBe(true);
    expect(eligible.value[0].taxReturn).toStrictEqual(mockReturn);
  });

  it('saveReturn updates account in inScope list', async () => {
    const { inScope, loadAccounts, saveReturn } = useTaxHub();
    await loadAccounts(1);
    mockApi.upsertTaxReturn.mockResolvedValue({ ...mockReturn, accountId: 9 });
    const ok = await saveReturn(1, 9, { income: 100, capitalGain: null, taxTakenOff: 20 });
    expect(ok).toBe(true);
    expect(inScope.value[0].taxReturn).not.toBeNull();
  });

  it('saveReturn returns false on error', async () => {
    mockApi.upsertTaxReturn.mockRejectedValue(new Error('Save failed'));
    const { loadAccounts, saveReturn } = useTaxHub();
    await loadAccounts(1);
    const ok = await saveReturn(1, 5, { income: 100, capitalGain: null, taxTakenOff: 0 });
    expect(ok).toBe(false);
  });

  it('uploadDocument appends doc to account', async () => {
    const { eligible, loadAccounts, uploadDocument } = useTaxHub();
    await loadAccounts(1);
    const file = new File(['content'], 'cert.pdf', { type: 'application/pdf' });
    const result = await uploadDocument(1, 5, file);
    expect(result).toStrictEqual(mockDoc);
    expect(eligible.value[0].documents).toHaveLength(1);
  });

  it('deleteDocument removes doc from account', async () => {
    const accountWithDoc: EligibleAccount = { ...mockAccount, documents: [mockDoc] };
    mockApi.getTaxEligibleAccounts.mockResolvedValue({
      ...mockResponse, eligible: [accountWithDoc],
    });
    const { eligible, loadAccounts, deleteDocument } = useTaxHub();
    await loadAccounts(1);
    await deleteDocument(1, 5, 20);
    expect(eligible.value[0].documents).toHaveLength(0);
  });

  it('moveToInScope calls addAccountToGroup and reloads', async () => {
    const { loadAccounts, moveToInScope } = useTaxHub();
    await loadAccounts(1);
    await moveToInScope(5);
    expect(mockApi.addAccountToGroup).toHaveBeenCalledWith(42, 5);
    expect(mockApi.getTaxEligibleAccounts).toHaveBeenCalledTimes(2);
  });

  it('moveToEligible calls removeAccountFromGroup and reloads', async () => {
    const { loadAccounts, moveToEligible } = useTaxHub();
    await loadAccounts(1);
    await moveToEligible(9);
    expect(mockApi.removeAccountFromGroup).toHaveBeenCalledWith(42, 9);
    expect(mockApi.getTaxEligibleAccounts).toHaveBeenCalledTimes(2);
  });
});
