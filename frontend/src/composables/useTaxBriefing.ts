/**
 * Composable for the Tax Briefing Pack: pick a person + tax year, then download the PDF.
 */
import { ref, type Ref } from 'vue';
import type { TaxPeriod } from '@models/TaxModels';
import { apiService } from '@services/ApiService';
import { authState } from '@/modules/auth';
import { useToast } from '@composables/useToast';

export interface BriefingPerson {
  id: number;
  name: string;
}

export interface UseTaxBriefing {
  people: Ref<BriefingPerson[]>;
  periods: Ref<TaxPeriod[]>;
  selectedMemberId: Ref<number | null>;
  selectedPeriodId: Ref<number | null>;
  loadingPeriods: Ref<boolean>;
  generating: Ref<boolean>;
  loadPeople: () => Promise<void>;
  loadPeriods: () => Promise<void>;
  generate: () => Promise<boolean>;
}

function slug(text: string): string {
  return text.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'x';
}

export function useTaxBriefing(): UseTaxBriefing {
  const { showError, showSuccess } = useToast();
  const people = ref<BriefingPerson[]>([]);
  const periods = ref<TaxPeriod[]>([]);
  const selectedMemberId = ref<number | null>(null);
  const selectedPeriodId = ref<number | null>(null);
  const loadingPeriods = ref(false);
  const generating = ref(false);

  function memberQuery(): number | undefined {
    return selectedMemberId.value === authState.user?.id ? undefined : selectedMemberId.value ?? undefined;
  }

  async function loadPeriods(): Promise<void> {
    if (selectedMemberId.value === null) return;
    loadingPeriods.value = true;
    selectedPeriodId.value = null;
    try {
      periods.value = await apiService.listTaxPeriods(memberQuery());
      selectedPeriodId.value = periods.value.length > 0 ? periods.value[0].id : null;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load tax years');
      periods.value = [];
    } finally {
      loadingPeriods.value = false;
    }
  }

  async function loadPeople(): Promise<void> {
    const self = authState.user;
    const list: BriefingPerson[] = [];
    const seen = new Set<number>();
    if (self) {
      list.push({ id: self.id, name: `${self.firstName} ${self.lastName}`.trim() + ' (You)' });
      seen.add(self.id);
    }
    try {
      for (const family of await apiService.getFamilies()) {
        for (const member of family.members) {
          if (seen.has(member.accountId)) continue;
          seen.add(member.accountId);
          list.push({ id: member.accountId, name: `${member.firstName} ${member.lastName}`.trim() });
        }
      }
    } catch {
      /* families are optional — fall back to self only */
    }
    people.value = list;
    if (self) {
      selectedMemberId.value = self.id;
      await loadPeriods();
    }
  }

  function filename(): string {
    const person = people.value.find((p) => p.id === selectedMemberId.value)?.name ?? 'member';
    const period = periods.value.find((p) => p.id === selectedPeriodId.value)?.name ?? '';
    return `tax-briefing-${slug(person)}-${slug(period)}.pdf`;
  }

  function triggerDownload(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function generate(): Promise<boolean> {
    if (selectedMemberId.value === null || selectedPeriodId.value === null) return false;
    generating.value = true;
    try {
      const blob = await apiService.downloadTaxBriefingPack(selectedPeriodId.value, memberQuery());
      triggerDownload(blob, filename());
      showSuccess('Briefing pack generated');
      return true;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to generate briefing pack');
      return false;
    } finally {
      generating.value = false;
    }
  }

  return {
    people,
    periods,
    selectedMemberId,
    selectedPeriodId,
    loadingPeriods,
    generating,
    loadPeople,
    loadPeriods,
    generate,
  };
}
