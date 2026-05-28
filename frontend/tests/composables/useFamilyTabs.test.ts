import { describe, it, expect, beforeEach, vi } from 'vitest';
import { computed, ref } from 'vue';
import { useFamilyTabs } from '@composables/useFamilyTabs';
import { apiService } from '@services/ApiService';
import type { PortfolioItem } from '@models/WealthTrackDataModels';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    getFamilies: vi.fn(),
    getFamilyMemberPortfolio: vi.fn(),
  },
}));

const mockApi = vi.mocked(apiService);

const member1 = { id: 1, accountId: 20, firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' };
const mockFamily = { id: 1, name: 'The Smiths', ownerId: 10, isOwner: true, members: [member1], createdAt: '', updatedAt: null };

const makeItem = (userId: number, instId: number | null = null, balance = '1000'): PortfolioItem => ({
  account: { id: userId * 10, name: 'Account', userId, institutionId: instId ?? 0, typeId: 1, statusId: 1, openedAt: null, closedAt: null, createdAt: '', updatedAt: '' },
  institution: instId ? { id: instId, userId, name: `Bank ${instId}`, createdAt: '', updatedAt: '' } : null,
  latestBalance: { id: 1, accountId: userId * 10, typeId: 1, userId, value: balance, date: '', createdAt: '', updatedAt: '' } as never,
  accountType: 'Savings',
});

const meItem = makeItem(10, 1);
const memberItem = makeItem(20, 2, '5000');
const memberPortfolio = { items: [memberItem], totalValue: 5000, accountCount: 1 };
const currentUser = { firstName: 'Mark', lastName: 'Lewis' };

describe('useFamilyTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getFamilies.mockResolvedValue([mockFamily]);
    mockApi.getFamilyMemberPortfolio.mockResolvedValue(memberPortfolio);
  });

  describe('Me tab (null)', () => {
    it('tableItems returns raw user items', () => {
      const rawItems = computed(() => [meItem]);
      const { tableItems, activeMemberId } = useFamilyTabs(() => 10, () => currentUser, rawItems);
      expect(activeMemberId.value).toBeNull();
      expect(tableItems.value).toStrictEqual([meItem]);
    });

    it('activeInstitutions is null for Me tab', () => {
      const { activeInstitutions } = useFamilyTabs(() => 10, () => currentUser, computed(() => [meItem]));
      expect(activeInstitutions.value).toBeNull();
    });
  });

  describe('member tab', () => {
    it('loads portfolio on selectMember', async () => {
      const { loadFamilyTabs, selectMember } = useFamilyTabs(() => 10, () => currentUser, computed(() => []));
      await loadFamilyTabs();
      selectMember(20);
      await new Promise((r) => setTimeout(r, 0));
      expect(mockApi.getFamilyMemberPortfolio).toHaveBeenCalledWith(1, 20);
    });

    it('tableItems returns member portfolio items', async () => {
      const { loadFamilyTabs, selectMember, tableItems } = useFamilyTabs(() => 10, () => currentUser, computed(() => [meItem]));
      await loadFamilyTabs();
      selectMember(20);
      await new Promise((r) => setTimeout(r, 0));
      expect(tableItems.value).toStrictEqual([memberItem]);
    });

    it('activeInstitutions derived from member items', async () => {
      const { loadFamilyTabs, selectMember, activeInstitutions } = useFamilyTabs(() => 10, () => currentUser, computed(() => []));
      await loadFamilyTabs();
      selectMember(20);
      await new Promise((r) => setTimeout(r, 0));
      expect(activeInstitutions.value).toHaveLength(1);
      expect(activeInstitutions.value?.[0].id).toBe(2);
    });
  });

  describe('All tab', () => {
    it('tableItems combines user + all member items', async () => {
      const { loadFamilyTabs, selectMember, tableItems } = useFamilyTabs(() => 10, () => currentUser, computed(() => [meItem]));
      await loadFamilyTabs();
      selectMember('all');
      await new Promise((r) => setTimeout(r, 0));
      expect(tableItems.value).toHaveLength(2);
    });

    it('activeInstitutions derived from all combined items', async () => {
      const { loadFamilyTabs, selectMember, activeInstitutions } = useFamilyTabs(() => 10, () => currentUser, computed(() => [meItem]));
      await loadFamilyTabs();
      selectMember('all');
      await new Promise((r) => setTimeout(r, 0));
      const ids = activeInstitutions.value?.map((i) => i.id) ?? [];
      expect(ids).toContain(1);
      expect(ids).toContain(2);
    });
  });

  describe('allMembers', () => {
    it('includes current user at head of list', async () => {
      const { loadFamilyTabs, allMembers } = useFamilyTabs(() => 10, () => currentUser, computed(() => []));
      await loadFamilyTabs();
      expect(allMembers.value[0].accountId).toBe(10);
      expect(allMembers.value[0].firstName).toBe('Mark');
      expect(allMembers.value[1].accountId).toBe(20);
    });
  });
});
