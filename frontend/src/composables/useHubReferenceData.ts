import { ref, onMounted, type Ref } from 'vue';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import { apiService } from '@/services/ApiService';

export function useHubReferenceData(): {
  accountTypes: Ref<ReferenceDataItem[]>;
  accountStatuses: Ref<ReferenceDataItem[]>;
  institutionTypes: Ref<ReferenceDataItem[]>;
  credentialTypes: Ref<ReferenceDataItem[]>;
  lifeExpectancy: Ref<number>;
  annuityRate: Ref<number>;
} {
  const accountTypes = ref<ReferenceDataItem[]>([]);
  const accountStatuses = ref<ReferenceDataItem[]>([]);
  const institutionTypes = ref<ReferenceDataItem[]>([]);
  const credentialTypes = ref<ReferenceDataItem[]>([]);
  const lifeExpectancy = ref(36);
  const annuityRate = ref(0.075);

  onMounted(() => {
    void Promise.all([
      apiService.getReferenceData('account_type'),
      apiService.getReferenceData('account_status'),
      apiService.getReferenceData('institution_type'),
      apiService.getReferenceData('credential_type'),
      apiService.getReferenceData('life_expectancy'),
      apiService.getReferenceData('annuity_assumption_rate'),
    ]).then(([types, statuses, instTypes, credTypes, lifeExpData, annuityData]) => {
      accountTypes.value = types;
      accountStatuses.value = statuses;
      institutionTypes.value = instTypes;
      credentialTypes.value = credTypes;
      if (lifeExpData[0]?.referenceValue) lifeExpectancy.value = parseFloat(lifeExpData[0].referenceValue);
      if (annuityData[0]?.referenceValue) annuityRate.value = parseFloat(annuityData[0].referenceValue);
    });
  });

  return { accountTypes, accountStatuses, institutionTypes, credentialTypes, lifeExpectancy, annuityRate };
}
