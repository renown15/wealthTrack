import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useShareSale } from '@composables/useShareSale';
import { apiService } from '@services/ApiService';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    recordShareSale: vi.fn(),
  },
}));

const mockApi = vi.mocked(apiService);

const mockItems = [
  { account: { id: 1, name: 'Current' }, accountType: 'Current Account', institution: null } as never,
  { account: { id: 2, name: 'Savings' }, accountType: 'Savings Account', institution: null } as never,
  { account: { id: 3, name: 'Fixed' }, accountType: 'Fixed / Bonus Rate Savings', institution: null } as never,
  { account: { id: 4, name: 'ISA' }, accountType: 'Cash ISA', institution: null } as never,
  { account: { id: 5, name: 'Tax' }, accountType: 'Tax Liability', institution: null } as never,
  { account: { id: 6, name: 'Shares' }, accountType: 'Shares', institution: null } as never,
];

const mockResponse = {
  sharesSold: '100',
  salePricePerShare: '15000',
  proceeds: '15000.00',
  purchasePricePerShare: '10000',
  cgt: '500.00',
  remainingShares: '0',
  cashNewBalance: '15000.00',
  taxLiabilityNewBalance: '500.00',
};

const salePayload = {
  sharesAccountId: 6,
  cashAccountId: 1,
  taxLiabilityAccountId: 5,
  sharesSold: '100',
  salePricePerShare: '15000',
};

describe('useShareSale', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.recordShareSale.mockResolvedValue(mockResponse);
  });

  describe('getCashAccounts', () => {
    it('returns only cash-type accounts', () => {
      const { getCashAccounts } = useShareSale();
      const result = getCashAccounts(mockItems);
      expect(result).toHaveLength(4);
      expect(result.map((i) => i.accountType)).toEqual([
        'Current Account', 'Savings Account', 'Fixed / Bonus Rate Savings', 'Cash ISA',
      ]);
    });

    it('excludes Shares and Tax Liability accounts', () => {
      const { getCashAccounts } = useShareSale();
      const result = getCashAccounts(mockItems);
      expect(result.every((i) => i.accountType !== 'Shares')).toBe(true);
      expect(result.every((i) => i.accountType !== 'Tax Liability')).toBe(true);
    });

    it('returns empty array when no cash accounts', () => {
      const { getCashAccounts } = useShareSale();
      expect(getCashAccounts([])).toEqual([]);
    });
  });

  describe('getTaxAccounts', () => {
    it('returns only Tax Liability accounts', () => {
      const { getTaxAccounts } = useShareSale();
      const result = getTaxAccounts(mockItems);
      expect(result).toHaveLength(1);
      expect(result[0].accountType).toBe('Tax Liability');
    });

    it('returns empty array when no tax accounts', () => {
      const { getTaxAccounts } = useShareSale();
      expect(getTaxAccounts([])).toEqual([]);
    });
  });

  describe('submitSale', () => {
    it('calls apiService.recordShareSale with payload and returns true on success', async () => {
      const { submitSale, result } = useShareSale();
      const ok = await submitSale(salePayload);
      expect(ok).toBe(true);
      expect(mockApi.recordShareSale).toHaveBeenCalledWith(salePayload);
      expect(result.value).toStrictEqual(mockResponse);
    });

    it('sets submitting to true during call and false after', async () => {
      const { submitSale, submitting } = useShareSale();
      const promise = submitSale(salePayload);
      expect(submitting.value).toBe(true);
      await promise;
      expect(submitting.value).toBe(false);
    });

    it('returns false and sets error on failure', async () => {
      mockApi.recordShareSale.mockRejectedValue(new Error('Server error'));
      const { submitSale, error } = useShareSale();
      const ok = await submitSale(salePayload);
      expect(ok).toBe(false);
      expect(error.value).toBe('Server error');
    });

    it('handles non-Error thrown values', async () => {
      mockApi.recordShareSale.mockRejectedValue('unexpected');
      const { submitSale, error } = useShareSale();
      const ok = await submitSale(salePayload);
      expect(ok).toBe(false);
      expect(error.value).toBe('Failed to record sale');
    });

    it('clears previous error before new submission', async () => {
      mockApi.recordShareSale.mockRejectedValueOnce(new Error('first error'));
      mockApi.recordShareSale.mockResolvedValueOnce(mockResponse);
      const { submitSale, error } = useShareSale();
      await submitSale(salePayload);
      expect(error.value).toBe('first error');
      await submitSale(salePayload);
      expect(error.value).toBeNull();
    });
  });

  describe('reset', () => {
    it('clears error, result, and submitting', async () => {
      mockApi.recordShareSale.mockRejectedValue(new Error('oops'));
      const { submitSale, reset, error, result, submitting } = useShareSale();
      await submitSale(salePayload);
      expect(error.value).toBe('oops');
      reset();
      expect(error.value).toBeNull();
      expect(result.value).toBeNull();
      expect(submitting.value).toBe(false);
    });
  });
});
