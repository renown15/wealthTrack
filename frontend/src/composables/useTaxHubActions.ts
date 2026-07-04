import { ref, computed, type Ref, type ComputedRef } from 'vue';
import { apiService } from '@services/ApiService';
import { authState, authModule } from '@/modules/auth';
import type { TaxPeriod } from '@models/TaxModels';

/**
 * Header actions for the Tax Hub: per-period commentary and the user's UTR.
 * Commentary saves onto the selected period; UTR saves onto the user record.
 */
export function useTaxHubActions(
  periods: Ref<TaxPeriod[]>,
  selectedPeriodId: Ref<number | null>,
): {
  commentaryOpen: Ref<boolean>;
  utrOpen: Ref<boolean>;
  selectedPeriod: ComputedRef<TaxPeriod | null>;
  currentUtr: ComputedRef<string | null>;
  saveCommentary: (html: string) => Promise<void>;
  saveUtr: (utr: string | null) => Promise<void>;
} {
  const commentaryOpen = ref(false);
  const utrOpen = ref(false);

  const selectedPeriod = computed(() =>
    periods.value.find((p) => p.id === selectedPeriodId.value) ?? null);
  const currentUtr = computed(() => authState.user?.utr ?? null);

  async function saveCommentary(html: string): Promise<void> {
    if (selectedPeriodId.value === null) return;
    const updated = await apiService.updateTaxPeriodCommentary(selectedPeriodId.value, html || null);
    const period = periods.value.find((p) => p.id === updated.id);
    if (period) period.commentary = updated.commentary;
    commentaryOpen.value = false;
  }

  async function saveUtr(utr: string | null): Promise<void> {
    const user = await apiService.setUtr(utr);
    authModule.setUser(user);
    utrOpen.value = false;
  }

  return { commentaryOpen, utrOpen, selectedPeriod, currentUtr, saveCommentary, saveUtr };
}
