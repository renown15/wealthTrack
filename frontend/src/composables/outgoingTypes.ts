import { ref, type Ref } from 'vue';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import { apiService } from '@/services/ApiService';
import { debug } from '@utils/debug';

/**
 * Outgoing account/institution types are classified in the DB under their own
 * reference-data class keys. The frontend loads those lists once so the
 * Outgoings-vs-wealth split is data-driven — adding an outgoing type is a
 * seed-only change with no code edits here.
 */
const outgoingAccountTypes = ref<ReferenceDataItem[]>([]);
const outgoingInstitutionTypes = ref<ReferenceDataItem[]>([]);
const accountTypeNames = ref<Set<string>>(new Set());
const institutionTypeNames = ref<Set<string>>(new Set());
let loadPromise: Promise<void> | null = null;

/** Fetch the outgoing type lists once (cached). Safe to call repeatedly. */
export function loadOutgoingTypes(): Promise<void> {
  if (!loadPromise) {
    loadPromise = Promise.all([
      apiService.getReferenceData('outgoing_account_type'),
      apiService.getReferenceData('outgoing_institution_type'),
    ])
      .then(([acc, inst]) => {
        outgoingAccountTypes.value = acc;
        outgoingInstitutionTypes.value = inst;
        accountTypeNames.value = new Set(acc.map((t) => t.referenceValue));
        institutionTypeNames.value = new Set(inst.map((t) => t.referenceValue));
      })
      .catch((error) => {
        loadPromise = null; // allow a retry on next call
        debug.error('[outgoingTypes] load error', error);
      });
  }
  return loadPromise;
}

export function useOutgoingTypes(): {
  outgoingAccountTypes: Ref<ReferenceDataItem[]>;
  outgoingInstitutionTypes: Ref<ReferenceDataItem[]>;
} {
  return { outgoingAccountTypes, outgoingInstitutionTypes };
}

export function isOutgoingAccountType(accountType?: string | null): boolean {
  return accountTypeNames.value.has(accountType ?? '');
}

export function isOutgoingInstitution(institutionType?: string | null): boolean {
  return institutionTypeNames.value.has(institutionType ?? '');
}
