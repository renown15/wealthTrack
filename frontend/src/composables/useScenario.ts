/** Composable for risk scenario list, detail, and CRUD operations */
import { reactive } from 'vue';
import { apiService } from '@services/ApiService';
import { debug } from '@utils/debug';
import { useToast } from '@composables/useToast';
import type { ScenarioDetail, ScenarioGroup, ScenarioListItem } from '@models/scenario';

export interface ScenarioState {
  scenarios: ScenarioListItem[];
  active: ScenarioDetail | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
}

export function useScenario(): {
  state: ScenarioState;
  loadScenarios: () => Promise<void>;
  loadDetail: (id: number) => Promise<void>;
  createScenario: (name: string) => Promise<ScenarioListItem | null>;
  renameScenario: (id: number, name: string) => Promise<boolean>;
  deleteScenario: (id: number) => Promise<boolean>;
  addGroup: (name: string) => Promise<ScenarioGroup | null>;
  renameGroup: (linkId: number, name: string) => Promise<boolean>;
  deleteGroup: (linkId: number) => Promise<boolean>;
  assignAccount: (accountId: number, groupId: number | null) => Promise<boolean>;
} {
  const { showError } = useToast();
  const state = reactive<ScenarioState>({
    scenarios: [],
    active: null,
    loading: false,
    detailLoading: false,
    error: null,
  });

  const loadScenarios = async (): Promise<void> => {
    state.loading = true;
    state.error = null;
    try {
      state.scenarios = await apiService.listScenarios();
    } catch (err) {
      state.error = err instanceof Error ? err.message : 'Failed to load scenarios';
      debug.error('[useScenario] loadScenarios:', err);
    } finally {
      state.loading = false;
    }
  };

  const loadDetail = async (id: number): Promise<void> => {
    state.detailLoading = true;
    try {
      state.active = await apiService.getScenario(id);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load scenario');
      debug.error('[useScenario] loadDetail:', err);
    } finally {
      state.detailLoading = false;
    }
  };

  const createScenario = async (name: string): Promise<ScenarioListItem | null> => {
    try {
      const item = await apiService.createScenario(name);
      state.scenarios.unshift(item);
      return item;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create scenario');
      return null;
    }
  };

  const renameScenario = async (id: number, name: string): Promise<boolean> => {
    try {
      const updated = await apiService.renameScenario(id, name);
      const idx = state.scenarios.findIndex(s => s.scenarioId === id);
      if (idx !== -1) state.scenarios[idx] = updated;
      if (state.active?.scenarioId === id) state.active.name = updated.name;
      return true;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to rename scenario');
      return false;
    }
  };

  const deleteScenario = async (id: number): Promise<boolean> => {
    try {
      await apiService.deleteScenario(id);
      state.scenarios = state.scenarios.filter(s => s.scenarioId !== id);
      if (state.active?.scenarioId === id) state.active = null;
      return true;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete scenario');
      return false;
    }
  };

  const addGroup = async (name: string): Promise<ScenarioGroup | null> => {
    if (!state.active) return null;
    try {
      const group = await apiService.addScenarioGroup(state.active.scenarioId, name);
      state.active.groups.push(group);
      const listItem = state.scenarios.find(s => s.scenarioId === state.active!.scenarioId);
      if (listItem) listItem.groupCount++;
      return group;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to add group');
      return null;
    }
  };

  const renameGroup = async (linkId: number, name: string): Promise<boolean> => {
    if (!state.active) return false;
    try {
      const updated = await apiService.renameScenarioGroup(state.active.scenarioId, linkId, name);
      const grp = state.active.groups.find(g => g.linkId === linkId);
      if (grp) grp.name = updated.name;
      return true;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to rename group');
      return false;
    }
  };

  const deleteGroup = async (linkId: number): Promise<boolean> => {
    if (!state.active) return false;
    const grp = state.active.groups.find(g => g.linkId === linkId);
    try {
      await apiService.deleteScenarioGroup(state.active.scenarioId, linkId);
      if (grp) {
        state.active.unassigned.push(...grp.accounts);
        state.active.groups = state.active.groups.filter(g => g.linkId !== linkId);
        const listItem = state.scenarios.find(s => s.scenarioId === state.active!.scenarioId);
        if (listItem) listItem.groupCount--;
      }
      return true;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete group');
      return false;
    }
  };

  const assignAccount = async (accountId: number, groupId: number | null): Promise<boolean> => {
    if (!state.active) return false;
    try {
      await apiService.assignScenarioAccount(state.active.scenarioId, accountId, groupId);
      // Update in-place — reloading via loadDetail unmounts ScenarioGroupTable and resets collapsed state
      const account =
        state.active.unassigned.find(a => a.accountId === accountId) ??
        state.active.groups.flatMap(g => g.accounts).find(a => a.accountId === accountId);
      if (account) {
        state.active.unassigned = state.active.unassigned.filter(a => a.accountId !== accountId);
        for (const g of state.active.groups) g.accounts = g.accounts.filter(a => a.accountId !== accountId);
        if (groupId === null) {
          state.active.unassigned.push(account);
        } else {
          const target = state.active.groups.find(g => g.groupId === groupId);
          if (target) target.accounts.push(account);
        }
      }
      return true;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to assign account');
      return false;
    }
  };

  return {
    state,
    loadScenarios,
    loadDetail,
    createScenario,
    renameScenario,
    deleteScenario,
    addGroup,
    renameGroup,
    deleteGroup,
    assignAccount,
  };
}
