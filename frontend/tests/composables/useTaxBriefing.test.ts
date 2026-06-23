import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTaxBriefing } from '@composables/useTaxBriefing';
import { apiService } from '@services/ApiService';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    getFamilies: vi.fn(),
    listTaxPeriods: vi.fn(),
    downloadTaxBriefingPack: vi.fn(),
  },
}));

const showError = vi.fn();
const showSuccess = vi.fn();
vi.mock('@/composables/useToast', () => ({ useToast: () => ({ showError, showSuccess }) }));

vi.mock('@/modules/auth', () => ({
  authState: { user: { id: 1, firstName: 'Mark', lastName: 'Lewis' } },
}));

const mockApi = vi.mocked(apiService);

const period = {
  id: 9, userId: 1, name: '2025/26', startDate: '2025-04-06', endDate: '2026-04-05',
  accountGroupId: null, createdAt: '', updatedAt: '',
};

const familyWithSelfAndPeer = [{
  id: 1, name: 'Fam', ownerId: 1, isOwner: true, createdAt: '', updatedAt: '',
  members: [
    { id: 11, accountId: 1, firstName: 'Mark', lastName: 'Lewis', email: '' },
    { id: 12, accountId: 2, firstName: 'Jane', lastName: 'Doe', email: '' },
  ],
}];

describe('useTaxBriefing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:x');
    globalThis.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    mockApi.listTaxPeriods.mockResolvedValue([period]);
  });

  it('loadPeople lists self (deduped) plus family members and loads self periods', async () => {
    mockApi.getFamilies.mockResolvedValue(familyWithSelfAndPeer as never);
    const b = useTaxBriefing();
    await b.loadPeople();
    expect(b.people.value).toStrictEqual([
      { id: 1, name: 'Mark Lewis (You)' },
      { id: 2, name: 'Jane Doe' },
    ]);
    expect(b.selectedMemberId.value).toBe(1);
    expect(mockApi.listTaxPeriods).toHaveBeenCalledWith(undefined);
    expect(b.selectedPeriodId.value).toBe(9);
  });

  it('falls back to self only when getFamilies fails', async () => {
    mockApi.getFamilies.mockRejectedValue(new Error('nope'));
    const b = useTaxBriefing();
    await b.loadPeople();
    expect(b.people.value).toStrictEqual([{ id: 1, name: 'Mark Lewis (You)' }]);
  });

  it('loadPeriods passes member id for a non-self member', async () => {
    const b = useTaxBriefing();
    b.selectedMemberId.value = 2;
    await b.loadPeriods();
    expect(mockApi.listTaxPeriods).toHaveBeenCalledWith(2);
  });

  it('generate downloads the pack for self (no member id) and reports success', async () => {
    const blob = new Blob(['%PDF-'], { type: 'application/pdf' });
    mockApi.downloadTaxBriefingPack.mockResolvedValue(blob);
    const b = useTaxBriefing();
    b.selectedMemberId.value = 1;
    b.selectedPeriodId.value = 9;
    const ok = await b.generate();
    expect(ok).toBe(true);
    expect(mockApi.downloadTaxBriefingPack).toHaveBeenCalledWith(9, undefined);
    expect(showSuccess).toHaveBeenCalled();
  });

  it('generate passes member id for a non-self member', async () => {
    mockApi.downloadTaxBriefingPack.mockResolvedValue(new Blob(['x']));
    const b = useTaxBriefing();
    b.selectedMemberId.value = 2;
    b.selectedPeriodId.value = 9;
    await b.generate();
    expect(mockApi.downloadTaxBriefingPack).toHaveBeenCalledWith(9, 2);
  });

  it('generate reports an error and returns false on failure', async () => {
    mockApi.downloadTaxBriefingPack.mockRejectedValue(new Error('boom'));
    const b = useTaxBriefing();
    b.selectedMemberId.value = 1;
    b.selectedPeriodId.value = 9;
    const ok = await b.generate();
    expect(ok).toBe(false);
    expect(showError).toHaveBeenCalled();
  });

  it('generate is a no-op without a selected period', async () => {
    const b = useTaxBriefing();
    b.selectedMemberId.value = 1;
    b.selectedPeriodId.value = null;
    expect(await b.generate()).toBe(false);
    expect(mockApi.downloadTaxBriefingPack).not.toHaveBeenCalled();
  });
});
