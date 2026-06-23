import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useScenario } from '@composables/useScenario';
import { apiService } from '@services/ApiService';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    listScenarios: vi.fn(),
    createScenario: vi.fn(),
    getScenario: vi.fn(),
    renameScenario: vi.fn(),
    deleteScenario: vi.fn(),
    addScenarioGroup: vi.fn(),
    renameScenarioGroup: vi.fn(),
    deleteScenarioGroup: vi.fn(),
    assignScenarioAccount: vi.fn(),
  },
}));

vi.mock('@/composables/useToast', () => ({ useToast: () => ({ showError: vi.fn() }) }));

const mockApi = vi.mocked(apiService);

const s1 = { scenarioId: 1, name: 'Plan A', ownerUserId: 10, isOwner: true, groupCount: 0, createdAt: '', updatedAt: '' };
const s2 = { scenarioId: 2, name: 'Plan B', ownerUserId: 10, isOwner: true, groupCount: 1, createdAt: '', updatedAt: '' };

const acc = { accountId: 5, name: 'ISA', institutionName: 'Barclays', accountType: 'Stocks ISA', balance: null, ownerInitials: 'JD', ownerName: 'Jane Doe' };

function freshDetail() {
  return {
    scenarioId: 1, name: 'Plan A', ownerUserId: 10, isOwner: true,
    groups: [{ linkId: 10, groupId: 20, name: 'Aggressive', sortOrder: 0, accounts: [acc] }],
    unassigned: [],
  };
}

describe('useScenario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.listScenarios.mockResolvedValue([s1]);
    mockApi.getScenario.mockImplementation(() => Promise.resolve(freshDetail()));
  });

  describe('loadScenarios', () => {
    it('populates state.scenarios', async () => {
      mockApi.listScenarios.mockResolvedValue([s1, s2]);
      const { state, loadScenarios } = useScenario();
      await loadScenarios();
      expect(state.scenarios).toHaveLength(2);
      expect(state.loading).toBe(false);
    });

    it('sets error on failure', async () => {
      mockApi.listScenarios.mockRejectedValue(new Error('Network error'));
      const { state, loadScenarios } = useScenario();
      await loadScenarios();
      expect(state.error).toBe('Network error');
    });
  });

  describe('loadDetail', () => {
    it('sets state.active', async () => {
      const { state, loadDetail } = useScenario();
      await loadDetail(1);
      expect(state.active?.scenarioId).toBe(1);
      expect(state.active?.name).toBe('Plan A');
      expect(state.detailLoading).toBe(false);
    });

    it('calls showError on failure', async () => {
      mockApi.getScenario.mockRejectedValue(new Error('Not found'));
      const { state, loadDetail } = useScenario();
      await loadDetail(99);
      expect(state.active).toBeNull();
    });
  });

  describe('createScenario', () => {
    it('prepends to state.scenarios and returns item', async () => {
      mockApi.createScenario.mockResolvedValue(s2);
      const { state, loadScenarios, createScenario } = useScenario();
      await loadScenarios();
      const result = await createScenario('Plan B');
      expect(result).toStrictEqual(s2);
      expect(state.scenarios[0]).toStrictEqual(s2);
    });

    it('returns null on failure', async () => {
      mockApi.createScenario.mockRejectedValue(new Error('Server error'));
      const { createScenario } = useScenario();
      const result = await createScenario('Bad');
      expect(result).toBeNull();
    });
  });

  describe('renameScenario', () => {
    it('updates list and active detail', async () => {
      const renamed = { ...s1, name: 'Renamed' };
      mockApi.renameScenario.mockResolvedValue(renamed);
      const { state, loadScenarios, loadDetail, renameScenario } = useScenario();
      await loadScenarios();
      await loadDetail(1);
      const ok = await renameScenario(1, 'Renamed');
      expect(ok).toBe(true);
      expect(state.scenarios.find(s => s.scenarioId === 1)?.name).toBe('Renamed');
      expect(state.active?.name).toBe('Renamed');
    });
  });

  describe('deleteScenario', () => {
    it('removes from list and clears active', async () => {
      mockApi.deleteScenario.mockResolvedValue(undefined);
      const { state, loadScenarios, loadDetail, deleteScenario } = useScenario();
      await loadScenarios();
      await loadDetail(1);
      const ok = await deleteScenario(1);
      expect(ok).toBe(true);
      expect(state.scenarios).toHaveLength(0);
      expect(state.active).toBeNull();
    });
  });

  describe('addGroup', () => {
    it('pushes group into active.groups', async () => {
      const newGrp = { linkId: 99, groupId: 88, name: 'Defensive', sortOrder: 1, accounts: [] };
      mockApi.addScenarioGroup.mockResolvedValue(newGrp);
      const { state, loadScenarios, loadDetail, addGroup } = useScenario();
      await loadScenarios();
      await loadDetail(1);
      const result = await addGroup('Defensive');
      expect(result).toStrictEqual(newGrp);
      expect(state.active?.groups).toHaveLength(2);
    });

    it('returns null when no active scenario', async () => {
      const { addGroup } = useScenario();
      const result = await addGroup('Test');
      expect(result).toBeNull();
    });
  });

  describe('renameGroup', () => {
    it('updates group name in active detail', async () => {
      mockApi.renameScenarioGroup.mockResolvedValue({ linkId: 10, groupId: 20, name: 'Conservative', sortOrder: 0, accounts: [] });
      const { state, loadDetail, renameGroup } = useScenario();
      await loadDetail(1);
      const ok = await renameGroup(10, 'Conservative');
      expect(ok).toBe(true);
      expect(state.active?.groups[0].name).toBe('Conservative');
    });
  });

  describe('deleteGroup', () => {
    it('removes group and moves accounts to unassigned', async () => {
      mockApi.deleteScenarioGroup.mockResolvedValue(undefined);
      const { state, loadScenarios, loadDetail, deleteGroup } = useScenario();
      await loadScenarios();
      await loadDetail(1);
      const ok = await deleteGroup(10);
      expect(ok).toBe(true);
      expect(state.active?.groups).toHaveLength(0);
      expect(state.active?.unassigned).toHaveLength(1);
    });
  });

  describe('assignAccount', () => {
    it('moves account to unassigned in local state without reloading', async () => {
      mockApi.assignScenarioAccount.mockResolvedValue(undefined);
      const { state, loadDetail, assignAccount } = useScenario();
      await loadDetail(1);
      const ok = await assignAccount(5, null);
      expect(ok).toBe(true);
      expect(mockApi.assignScenarioAccount).toHaveBeenCalledWith(1, 5, null);
      expect(mockApi.getScenario).toHaveBeenCalledTimes(1); // no reload
      expect(state.active?.groups[0].accounts).toHaveLength(0);
      expect(state.active?.unassigned).toHaveLength(1);
    });

    it('moves account to target group in local state', async () => {
      mockApi.assignScenarioAccount.mockResolvedValue(undefined);
      const unassignedAcc = { ...acc, accountId: 7 };
      mockApi.getScenario.mockResolvedValue({
        scenarioId: 1, name: 'Plan A', ownerUserId: 10, isOwner: true,
        groups: [{ linkId: 10, groupId: 20, name: 'Aggressive', sortOrder: 0, accounts: [] }],
        unassigned: [unassignedAcc],
      });
      const { state, loadDetail, assignAccount } = useScenario();
      await loadDetail(1);
      await assignAccount(7, 20);
      expect(state.active?.groups[0].accounts).toHaveLength(1);
      expect(state.active?.unassigned).toHaveLength(0);
    });
  });
});
