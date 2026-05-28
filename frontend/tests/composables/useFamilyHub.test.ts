import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFamilyHub } from '@composables/useFamilyHub';
import { apiService } from '@services/ApiService';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    getFamilies: vi.fn(),
    getFamilyMemberPortfolio: vi.fn(),
  },
}));

const mockApi = vi.mocked(apiService);

const member1 = { id: 1, accountId: 20, firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' };
const member2 = { id: 2, accountId: 30, firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com' };
const mockFamily = { id: 1, name: 'The Smiths', ownerId: 10, isOwner: true, members: [member1, member2], createdAt: '', updatedAt: null };
const mockPortfolio = {
  items: [{ account: { id: 5, name: 'Savings', userId: 20, institutionId: 1, typeId: 1, statusId: 1, openedAt: null, closedAt: null, createdAt: '', updatedAt: '' }, institution: null, latestBalance: null }],
  totalValue: 5000,
  accountCount: 1,
};

describe('useFamilyHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getFamilies.mockResolvedValue([]);
    mockApi.getFamilyMemberPortfolio.mockResolvedValue(mockPortfolio);
  });

  describe('loadFamily', () => {
    it('sets family from first result', async () => {
      mockApi.getFamilies.mockResolvedValue([mockFamily]);
      const { state, loadFamily } = useFamilyHub(() => 10);
      await loadFamily();
      expect(state.family).toStrictEqual(mockFamily);
      expect(state.loading).toBe(false);
    });

    it('sets family to null when empty', async () => {
      const { state, loadFamily } = useFamilyHub(() => 10);
      await loadFamily();
      expect(state.family).toBeNull();
    });

    it('sets error on failure', async () => {
      mockApi.getFamilies.mockRejectedValue(new Error('Network'));
      const { state, loadFamily } = useFamilyHub(() => 10);
      await loadFamily();
      expect(state.error).toBe('Network');
      expect(state.family).toBeNull();
    });
  });

  describe('otherMembers', () => {
    it('excludes currentUserId', async () => {
      const { state, otherMembers } = useFamilyHub(() => 20);
      state.family = mockFamily;
      expect(otherMembers.value.map((m) => m.accountId)).not.toContain(20);
      expect(otherMembers.value.map((m) => m.accountId)).toContain(30);
    });

    it('returns empty when no family', () => {
      const { otherMembers } = useFamilyHub(() => 10);
      expect(otherMembers.value).toHaveLength(0);
    });
  });

  describe('loadMemberPortfolio', () => {
    it('loads portfolio for a member', async () => {
      const { state, loadMemberPortfolio } = useFamilyHub(() => 10);
      state.family = mockFamily;
      await loadMemberPortfolio(20);
      expect(state.memberPortfolios[20]?.portfolio).toStrictEqual(mockPortfolio);
      expect(state.memberPortfolios[20]?.loading).toBe(false);
    });

    it('sets error state on failure', async () => {
      mockApi.getFamilyMemberPortfolio.mockRejectedValue(new Error('Forbidden'));
      const { state, loadMemberPortfolio } = useFamilyHub(() => 10);
      state.family = mockFamily;
      await loadMemberPortfolio(20);
      expect(state.memberPortfolios[20]?.error).toBe('Forbidden');
    });
  });

  describe('loadAllMemberPortfolios', () => {
    it('loads all unloaded member portfolios', async () => {
      const { state, loadAllMemberPortfolios } = useFamilyHub(() => 10);
      state.family = mockFamily;
      await loadAllMemberPortfolios();
      expect(mockApi.getFamilyMemberPortfolio).toHaveBeenCalledTimes(2);
      expect(state.memberPortfolios[20]?.portfolio).toStrictEqual(mockPortfolio);
      expect(state.memberPortfolios[30]?.portfolio).toStrictEqual(mockPortfolio);
    });

    it('skips already-loaded members', async () => {
      const { state, loadAllMemberPortfolios } = useFamilyHub(() => 10);
      state.family = mockFamily;
      state.memberPortfolios[20] = { portfolio: mockPortfolio, loading: false, error: null };
      await loadAllMemberPortfolios();
      expect(mockApi.getFamilyMemberPortfolio).toHaveBeenCalledTimes(1);
    });
  });
});
