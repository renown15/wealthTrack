import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useQuickAddAccount } from '@composables/useQuickAddAccount';
import { apiService } from '@services/ApiService';
import type { Institution, ReferenceDataItem, Account } from '@models/WealthTrackDataModels';
import type { AccountFormData } from '@views/AccountHub/addAccountModalValidation';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    getInstitutions: vi.fn(),
    getReferenceData: vi.fn(),
    createAccount: vi.fn(),
  },
}));

vi.mock('@composables/useToast', () => ({
  useToast: () => ({ showError: vi.fn() }),
}));

const mockApi = vi.mocked(apiService);

const mockInstitutions: Institution[] = [
  { id: 1, userId: 1, name: 'Test Bank' },
];

const mockAccountTypes: ReferenceDataItem[] = [
  { id: 10, classKey: 'account_type', referenceValue: 'Savings Account', sortIndex: 1 },
];

const mockStatuses: ReferenceDataItem[] = [
  { id: 20, classKey: 'account_status', referenceValue: 'Active', sortIndex: 1 },
  { id: 21, classKey: 'account_status', referenceValue: 'Closed', sortIndex: 2 },
];

const mockInstitutionTypes: ReferenceDataItem[] = [
  { id: 30, classKey: 'institution_type', referenceValue: 'Bank', sortIndex: 1 },
];

const mockAccount: Account = {
  id: 99, userId: 1, institutionId: 1, name: 'My Saver',
  typeId: 10, statusId: 21, openedAt: null, closedAt: null,
  createdAt: '2024-01-01T00:00:00', updatedAt: '2024-01-01T00:00:00',
};

const baseFormData: AccountFormData = {
  name: 'My Saver',
  institutionId: 1,
  typeId: 10,
  statusId: 21,
  interestRate: '4.5',
};

describe('useQuickAddAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getInstitutions.mockResolvedValue(mockInstitutions);
    mockApi.getReferenceData.mockImplementation((key: string) => {
      if (key === 'account_type') return Promise.resolve(mockAccountTypes);
      if (key === 'account_status') return Promise.resolve(mockStatuses);
      if (key === 'institution_type') return Promise.resolve(mockInstitutionTypes);
      return Promise.resolve([]);
    });
    mockApi.createAccount.mockResolvedValue(mockAccount);
  });

  it('loadFormData populates all form data', async () => {
    const { institutions, accountTypes, accountStatuses, institutionTypes, loadFormData } = useQuickAddAccount();
    await loadFormData();
    expect(institutions.value).toStrictEqual(mockInstitutions);
    expect(accountTypes.value).toStrictEqual(mockAccountTypes);
    expect(accountStatuses.value).toStrictEqual(mockStatuses);
    expect(institutionTypes.value).toStrictEqual(mockInstitutionTypes);
  });

  it('getClosedStatusId returns correct id after loadFormData', async () => {
    const { loadFormData, getClosedStatusId } = useQuickAddAccount();
    await loadFormData();
    expect(getClosedStatusId()).toBe(21);
  });

  it('getClosedStatusId returns null when Closed status not found', async () => {
    mockApi.getReferenceData.mockImplementation((key: string) => {
      if (key === 'account_status') return Promise.resolve([]);
      return Promise.resolve([]);
    });
    const { loadFormData, getClosedStatusId } = useQuickAddAccount();
    await loadFormData();
    expect(getClosedStatusId()).toBeNull();
  });

  it('createClosedAccount calls createAccount with mapped fields', async () => {
    const { createClosedAccount } = useQuickAddAccount();
    const id = await createClosedAccount(baseFormData);
    expect(id).toBe(99);
    expect(mockApi.createAccount).toHaveBeenCalledWith(expect.objectContaining({
      institutionId: 1,
      name: 'My Saver',
      typeId: 10,
      statusId: 21,
      interestRate: '4.5',
    }));
  });

  it('createClosedAccount omits empty optional string fields', async () => {
    const { createClosedAccount } = useQuickAddAccount();
    await createClosedAccount({ ...baseFormData, interestRate: '', sortCode: null, accountNumber: undefined });
    expect(mockApi.createAccount).toHaveBeenCalledWith(expect.objectContaining({
      interestRate: undefined,
      sortCode: undefined,
      accountNumber: undefined,
    }));
  });

  it('createClosedAccount returns null and shows error on API failure', async () => {
    mockApi.createAccount.mockRejectedValue(new Error('Server error'));
    const { createClosedAccount } = useQuickAddAccount();
    const id = await createClosedAccount(baseFormData);
    expect(id).toBeNull();
  });

  it('saving is true during creation and false after', async () => {
    let savingDuring = false;
    mockApi.createAccount.mockImplementation(async () => {
      savingDuring = saving.value;
      return mockAccount;
    });
    const { saving, createClosedAccount } = useQuickAddAccount();
    await createClosedAccount(baseFormData);
    expect(savingDuring).toBe(true);
    expect(saving.value).toBe(false);
  });
});
