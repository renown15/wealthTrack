import { describe, it, expect, beforeEach, vi } from 'vitest';
import { scenarioService } from '@services/ScenarioService';

const clientStub = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };

const s1 = { scenarioId: 1, name: 'Plan A', ownerUserId: 10, isOwner: true, groupCount: 0, createdAt: '', updatedAt: '' };
const grp = { linkId: 5, groupId: 7, name: 'High Risk', sortOrder: 0, accounts: [] };
const detail = { scenarioId: 1, name: 'Plan A', ownerUserId: 10, isOwner: true, groups: [], unassigned: [] };

describe('ScenarioService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scenarioService.client = clientStub as never;
  });

  describe('listScenarios', () => {
    it('returns scenario list', async () => {
      clientStub.get.mockResolvedValue({ data: [s1] });
      const result = await scenarioService.listScenarios();
      expect(result).toEqual([s1]);
      expect(clientStub.get).toHaveBeenCalledWith('/api/v1/scenarios');
    });

    it('throws on error', async () => {
      clientStub.get.mockRejectedValue(new Error('Network'));
      await expect(scenarioService.listScenarios()).rejects.toThrow();
    });
  });

  describe('createScenario', () => {
    it('posts name and returns scenario', async () => {
      clientStub.post.mockResolvedValue({ data: s1 });
      const result = await scenarioService.createScenario('Plan A');
      expect(result).toStrictEqual(s1);
      expect(clientStub.post).toHaveBeenCalledWith('/api/v1/scenarios', { name: 'Plan A' });
    });
  });

  describe('getScenario', () => {
    it('fetches detail by id', async () => {
      clientStub.get.mockResolvedValue({ data: detail });
      const result = await scenarioService.getScenario(1);
      expect(result).toStrictEqual(detail);
      expect(clientStub.get).toHaveBeenCalledWith('/api/v1/scenarios/1');
    });
  });

  describe('renameScenario', () => {
    it('puts new name', async () => {
      const updated = { ...s1, name: 'Renamed' };
      clientStub.put.mockResolvedValue({ data: updated });
      const result = await scenarioService.renameScenario(1, 'Renamed');
      expect(result.name).toBe('Renamed');
      expect(clientStub.put).toHaveBeenCalledWith('/api/v1/scenarios/1', { name: 'Renamed' });
    });
  });

  describe('deleteScenario', () => {
    it('sends delete request', async () => {
      clientStub.delete.mockResolvedValue({ data: undefined });
      await scenarioService.deleteScenario(1);
      expect(clientStub.delete).toHaveBeenCalledWith('/api/v1/scenarios/1');
    });
  });

  describe('addGroup', () => {
    it('posts group name and returns group', async () => {
      clientStub.post.mockResolvedValue({ data: grp });
      const result = await scenarioService.addGroup(1, 'High Risk');
      expect(result).toStrictEqual(grp);
      expect(clientStub.post).toHaveBeenCalledWith('/api/v1/scenarios/1/groups', { name: 'High Risk' });
    });
  });

  describe('renameGroup', () => {
    it('puts new group name', async () => {
      const updated = { ...grp, name: 'Low Risk' };
      clientStub.put.mockResolvedValue({ data: updated });
      const result = await scenarioService.renameGroup(1, 5, 'Low Risk');
      expect(result.name).toBe('Low Risk');
      expect(clientStub.put).toHaveBeenCalledWith('/api/v1/scenarios/1/groups/5', { name: 'Low Risk' });
    });
  });

  describe('deleteGroup', () => {
    it('sends delete request', async () => {
      clientStub.delete.mockResolvedValue({ data: undefined });
      await scenarioService.deleteGroup(1, 5);
      expect(clientStub.delete).toHaveBeenCalledWith('/api/v1/scenarios/1/groups/5');
    });
  });

  describe('assignAccount', () => {
    it('posts assignment with groupId', async () => {
      clientStub.post.mockResolvedValue({ data: undefined });
      await scenarioService.assignAccount(1, 42, 7);
      expect(clientStub.post).toHaveBeenCalledWith('/api/v1/scenarios/1/assignments', { accountId: 42, groupId: 7 });
    });

    it('posts unassignment with null groupId', async () => {
      clientStub.post.mockResolvedValue({ data: undefined });
      await scenarioService.assignAccount(1, 42, null);
      expect(clientStub.post).toHaveBeenCalledWith('/api/v1/scenarios/1/assignments', { accountId: 42, groupId: null });
    });
  });
});
