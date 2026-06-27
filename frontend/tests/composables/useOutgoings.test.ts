import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isRenewingWithin30Days, formatRenewalDate, useOutgoings } from '@composables/useOutgoings';
import { apiService } from '@services/ApiService';

vi.mock('@services/ApiService', () => ({
  apiService: {
    getPortfolio: vi.fn(),
    getInstitutions: vi.fn(),
    createAccount: vi.fn(),
    updateAccount: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));

const mockPortfolio = {
  items: [
    {
      account: { id: 1, name: 'Gas', monthlyCost: '45.00', renewalDate: null },
      institution: { id: 1, name: 'British Gas' },
      accountType: 'Utility - Gas',
      docCount: 0,
    },
    {
      account: { id: 2, name: 'Internet', monthlyCost: '30.00', renewalDate: null },
      institution: { id: 2, name: 'BT' },
      accountType: 'Current Account',
      docCount: 0,
    },
  ],
};

function futureDateDDMMYYYY(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

describe('isRenewingWithin30Days', () => {
  it('returns false for null', () => {
    expect(isRenewingWithin30Days(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isRenewingWithin30Days(undefined)).toBe(false);
  });

  it('returns false for badly formatted date', () => {
    expect(isRenewingWithin30Days('not-a-date')).toBe(false);
  });

  it('returns true when date is 10 days away', () => {
    expect(isRenewingWithin30Days(futureDateDDMMYYYY(10))).toBe(true);
  });

  it('returns false when date is 40 days away', () => {
    expect(isRenewingWithin30Days(futureDateDDMMYYYY(40))).toBe(false);
  });

  it('returns false for past date', () => {
    expect(isRenewingWithin30Days('01/01/2020')).toBe(false);
  });
});

describe('formatRenewalDate', () => {
  it('returns em dash for null', () => {
    expect(formatRenewalDate(null)).toBe('—');
  });

  it('returns em dash for undefined', () => {
    expect(formatRenewalDate(undefined)).toBe('—');
  });

  it('returns raw value for malformed date', () => {
    expect(formatRenewalDate('bad')).toBe('bad');
  });

  it('formats a valid DD/MM/YYYY date', () => {
    const result = formatRenewalDate('15/06/2026');
    expect(result).toMatch(/Jun|2026/);
  });
});

describe('useOutgoings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiService.getPortfolio).mockResolvedValue(mockPortfolio as never);
    vi.mocked(apiService.createAccount).mockResolvedValue({ id: 99 } as never);
    vi.mocked(apiService.updateAccount).mockResolvedValue({ id: 1 } as never);
    vi.mocked(apiService.deleteAccount).mockResolvedValue(undefined as never);
  });

  it('loads portfolio and filters to outgoing types', async () => {
    const { loadPortfolio, outgoingItems } = useOutgoings();
    await loadPortfolio();
    expect(outgoingItems.value.length).toBe(1);
    expect(outgoingItems.value[0].accountType).toBe('Utility - Gas');
  });

  it('calculates total monthly cost and annual cost', async () => {
    const { loadPortfolio, stats } = useOutgoings();
    await loadPortfolio();
    expect(stats.value.totalMonthlyGbp).toBe(45);
    expect(stats.value.totalAnnualGbp).toBe(540);
  });

  it('sets error on portfolio load failure', async () => {
    vi.mocked(apiService.getPortfolio).mockRejectedValue(new Error('Network error'));
    const { loadPortfolio, error } = useOutgoings();
    await loadPortfolio();
    expect(error.value).toBe('Network error');
  });

  it('createAccount returns account on success and reloads', async () => {
    const { createAccount } = useOutgoings();
    const result = await createAccount({ name: 'Gas', institutionId: 1, typeId: 1, statusId: 1 } as never);
    expect(result).toEqual({ id: 99 });
    expect(apiService.getPortfolio).toHaveBeenCalled();
  });

  it('createAccount returns null on error', async () => {
    vi.mocked(apiService.createAccount).mockRejectedValue(new Error('Failed'));
    const { createAccount, error } = useOutgoings();
    const result = await createAccount({ name: 'Gas', institutionId: 1, typeId: 1, statusId: 1 } as never);
    expect(result).toBeNull();
    expect(error.value).toBe('Failed');
  });

  it('updateAccount returns true on success', async () => {
    const { updateAccount } = useOutgoings();
    const ok = await updateAccount(1, { name: 'Gas', institutionId: 1, typeId: 1, statusId: 1 } as never);
    expect(ok).toBe(true);
  });

  it('updateAccount returns false on error', async () => {
    vi.mocked(apiService.updateAccount).mockRejectedValue(new Error('Update failed'));
    const { updateAccount } = useOutgoings();
    const ok = await updateAccount(1, { name: 'Gas', institutionId: 1, typeId: 1, statusId: 1 } as never);
    expect(ok).toBe(false);
  });

  it('deleteAccount removes item and returns true', async () => {
    const { loadPortfolio, deleteAccount, outgoingItems } = useOutgoings();
    await loadPortfolio();
    const ok = await deleteAccount(1);
    expect(ok).toBe(true);
    expect(outgoingItems.value.find((i) => i.account.id === 1)).toBeUndefined();
  });

  it('deleteAccount returns false on error', async () => {
    vi.mocked(apiService.deleteAccount).mockRejectedValue(new Error('Delete failed'));
    const { deleteAccount } = useOutgoings();
    const ok = await deleteAccount(99);
    expect(ok).toBe(false);
  });
});
