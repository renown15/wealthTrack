/**
 * Composable for managing tax periods (list, create, delete, selection).
 */
import { ref, type Ref } from 'vue';
import type { TaxPeriod, TaxPeriodCreateRequest } from '@models/TaxModels';
import { apiService } from '@services/ApiService';
import { useToast } from '@composables/useToast';

export function useTaxPeriods(): {
  periods: Ref<TaxPeriod[]>;
  selectedPeriodId: Ref<number | null>;
  selectedPeriod: () => TaxPeriod | null;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  loadPeriods: () => Promise<void>;
  createPeriod: (data: TaxPeriodCreateRequest) => Promise<TaxPeriod | null>;
  deletePeriod: (periodId: number) => Promise<void>;
  selectPeriod: (periodId: number) => void;
} {
  const periods = ref<TaxPeriod[]>([]);
  const selectedPeriodId = ref<number | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const { showError } = useToast();

  const selectedPeriod = (): TaxPeriod | null =>
    periods.value.find((p) => p.id === selectedPeriodId.value) ?? null;

  async function loadPeriods(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      periods.value = await apiService.listTaxPeriods();
      if (periods.value.length > 0 && selectedPeriodId.value === null) {
        selectedPeriodId.value = periods.value[0].id;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load tax periods';
    } finally {
      loading.value = false;
    }
  }

  async function createPeriod(data: TaxPeriodCreateRequest): Promise<TaxPeriod | null> {
    try {
      const created = await apiService.createTaxPeriod(data);
      periods.value = [created, ...periods.value];
      selectedPeriodId.value = created.id;
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create tax period';
      showError(msg);
      return null;
    }
  }

  async function deletePeriod(periodId: number): Promise<void> {
    try {
      await apiService.deleteTaxPeriod(periodId);
      periods.value = periods.value.filter((p) => p.id !== periodId);
      if (selectedPeriodId.value === periodId) {
        selectedPeriodId.value = periods.value[0]?.id ?? null;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete tax period';
      showError(msg);
    }
  }

  function selectPeriod(periodId: number): void {
    selectedPeriodId.value = periodId;
  }

  return {
    periods,
    selectedPeriodId,
    selectedPeriod,
    loading,
    error,
    loadPeriods,
    createPeriod,
    deletePeriod,
    selectPeriod,
  };
}
