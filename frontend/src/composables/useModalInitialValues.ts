import { computed, type ComputedRef, type Ref } from 'vue';
import type { Account, Institution } from '@/models/WealthTrackDataModels';

export function useModalInitialValues(editingItem: Ref<Account | Institution | null>): {
  initialModalName: ComputedRef<string>;
  initialModalInstitutionId: ComputedRef<number>;
  initialModalTypeId: ComputedRef<number>;
  initialModalStatusId: ComputedRef<number>;
  initialModalOpenedAt: ComputedRef<string | null>;
  initialModalClosedAt: ComputedRef<string | null>;
  initialModalAccountNumber: ComputedRef<string | null | undefined>;
  initialModalSortCode: ComputedRef<string | null | undefined>;
  initialModalRollRefNumber: ComputedRef<string | null | undefined>;
  initialModalInterestRate: ComputedRef<string | null | undefined>;
  initialModalFixedBonusRate: ComputedRef<string | null | undefined>;
  initialModalFixedBonusRateEndDate: ComputedRef<string | null | undefined>;
  initialModalReleaseDate: ComputedRef<string | null | undefined>;
  initialModalNumberOfShares: ComputedRef<string | null | undefined>;
  initialModalUnderlying: ComputedRef<string | null | undefined>;
  initialModalPrice: ComputedRef<string | null | undefined>;
  initialModalPurchasePrice: ComputedRef<string | null | undefined>;
  initialModalPensionMonthlyPayment: ComputedRef<string | null | undefined>;
  initialModalAssetClass: ComputedRef<string | null | undefined>;
  initialModalEncumbrance: ComputedRef<string | null | undefined>;
  initialModalTaxYear: ComputedRef<string | null | undefined>;
  initialModalParentId: ComputedRef<number | null | undefined>;
  initialModalInstitutionType: ComputedRef<string | null | undefined>;
} {
  const initialModalName = computed(() => editingItem.value?.name ?? '');
  const initialModalInstitutionId = computed(() =>
    editingItem.value && 'institutionId' in editingItem.value ? editingItem.value.institutionId : 0);
  const initialModalTypeId = computed(() =>
    editingItem.value && 'typeId' in editingItem.value ? editingItem.value.typeId : 0);
  const initialModalStatusId = computed(() =>
    editingItem.value && 'statusId' in editingItem.value ? editingItem.value.statusId : 0);
  const initialModalOpenedAt = computed(() =>
    editingItem.value && 'openedAt' in editingItem.value ? (editingItem.value).openedAt : null);
  const initialModalClosedAt = computed(() =>
    editingItem.value && 'closedAt' in editingItem.value ? (editingItem.value).closedAt : null);
  const initialModalAccountNumber = computed(() =>
    editingItem.value && 'accountNumber' in editingItem.value ? (editingItem.value).accountNumber : null);
  const initialModalSortCode = computed(() =>
    editingItem.value && 'sortCode' in editingItem.value ? (editingItem.value).sortCode : null);
  const initialModalRollRefNumber = computed(() =>
    editingItem.value && 'rollRefNumber' in editingItem.value ? (editingItem.value).rollRefNumber : null);
  const initialModalInterestRate = computed(() =>
    editingItem.value && 'interestRate' in editingItem.value ? (editingItem.value).interestRate : null);
  const initialModalFixedBonusRate = computed(() =>
    editingItem.value && 'fixedBonusRate' in editingItem.value ? (editingItem.value).fixedBonusRate : null);
  const initialModalFixedBonusRateEndDate = computed(() =>
    editingItem.value && 'fixedBonusRateEndDate' in editingItem.value ? (editingItem.value).fixedBonusRateEndDate : null);
  const initialModalReleaseDate = computed(() =>
    editingItem.value && 'releaseDate' in editingItem.value ? (editingItem.value).releaseDate : null);
  const initialModalNumberOfShares = computed(() =>
    editingItem.value && 'numberOfShares' in editingItem.value ? (editingItem.value).numberOfShares : null);
  const initialModalUnderlying = computed(() =>
    editingItem.value && 'underlying' in editingItem.value ? (editingItem.value).underlying : null);
  const initialModalPrice = computed(() =>
    editingItem.value && 'price' in editingItem.value ? (editingItem.value).price : null);
  const initialModalPurchasePrice = computed(() =>
    editingItem.value && 'purchasePrice' in editingItem.value ? (editingItem.value).purchasePrice : null);
  const initialModalPensionMonthlyPayment = computed(() =>
    editingItem.value && 'pensionMonthlyPayment' in editingItem.value ? (editingItem.value).pensionMonthlyPayment : null);
  const initialModalAssetClass = computed(() =>
    editingItem.value && 'assetClass' in editingItem.value ? (editingItem.value).assetClass : null);
  const initialModalEncumbrance = computed(() =>
    editingItem.value && 'encumbrance' in editingItem.value ? (editingItem.value).encumbrance : null);
  const initialModalTaxYear = computed(() =>
    editingItem.value && 'taxYear' in editingItem.value ? (editingItem.value as Account & { taxYear?: string | null }).taxYear : null);
  const initialModalParentId = computed(() =>
    editingItem.value && 'parentId' in editingItem.value ? (editingItem.value).parentId : null);
  const initialModalInstitutionType = computed(() =>
    editingItem.value && 'institutionType' in editingItem.value ? (editingItem.value).institutionType : null);

  return {
    initialModalName,
    initialModalInstitutionId,
    initialModalTypeId,
    initialModalStatusId,
    initialModalOpenedAt,
    initialModalClosedAt,
    initialModalAccountNumber,
    initialModalSortCode,
    initialModalRollRefNumber,
    initialModalInterestRate,
    initialModalFixedBonusRate,
    initialModalFixedBonusRateEndDate,
    initialModalReleaseDate,
    initialModalNumberOfShares,
    initialModalUnderlying,
    initialModalPrice,
    initialModalPurchasePrice,
    initialModalPensionMonthlyPayment,
    initialModalAssetClass,
    initialModalEncumbrance,
    initialModalTaxYear,
    initialModalParentId,
    initialModalInstitutionType,
  };
}
