import { ref, type Ref } from 'vue';
import { apiService } from '@services/ApiService';
import type { ActualCostItem } from '@models/outgoing';
import { debug } from '@utils/debug';

export interface UseActualCostsReturn {
  actuals: Ref<ActualCostItem[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  loadActuals: (accountId: number) => Promise<void>;
  addActual: (accountId: number, amount: string, costDate: string) => Promise<boolean>;
  removeActual: (groupId: number) => Promise<boolean>;
}

/** Historic actual costs for one outgoing account (Provision costing). */
export function useActualCosts(): UseActualCostsReturn {
  const actuals = ref<ActualCostItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadActuals(accountId: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      actuals.value = await apiService.listActualCosts(accountId);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load actual costs';
      debug.error('[useActualCosts] load error', e);
    } finally {
      loading.value = false;
    }
  }

  async function addActual(accountId: number, amount: string, costDate: string): Promise<boolean> {
    error.value = null;
    try {
      await apiService.recordActualCost(accountId, { amount, cost_date: costDate });
      await loadActuals(accountId);
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to record actual cost';
      debug.error('[useActualCosts] add error', e);
      return false;
    }
  }

  async function removeActual(groupId: number): Promise<boolean> {
    error.value = null;
    try {
      await apiService.deleteActualCost(groupId);
      actuals.value = actuals.value.filter((a) => a.groupId !== groupId);
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete actual cost';
      debug.error('[useActualCosts] delete error', e);
      return false;
    }
  }

  return { actuals, loading, error, loadActuals, addActual, removeActual };
}
