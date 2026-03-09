import { computed, type Ref } from 'vue';
import type { Account, Institution } from '@/models/WealthTrackDataModels';

export function useModalInitialValues(editingItem: Ref<Account | Institution | null>) {
  const initialModalName = computed(() => editingItem.value?.name ?? '');
  const initialModalInstitutionId = computed(() =>
    editingItem.value && 'institutionId' in editingItem.value ? editingItem.value.institutionId : 0);
  const initialModalTypeId = computed(() =>
    editingItem.value && 'typeId' in editingItem.value ? editingItem.value.typeId : 0);
  const initialModalStatusId = computed(() =>
    editingItem.value && 'statusId' in editingItem.value ? editingItem.value.statusId : 0);
  const initialModalOpenedAt = computed(() =>
    editingItem.value && 'openedAt' in editingItem.value ? (editingItem.value as Account).openedAt : null);
  const initialModalClosedAt = computed(() =>
    editingItem.value && 'closedAt' in editingItem.value ? (editingItem.value as Account).closedAt : null);
  const initialModalAccountNumber = computed(() =>
    editingItem.value && 'accountNumber' in editingItem.value ? (editingItem.value as Account).accountNumber : null);
  const initialModalSortCode = computed(() =>
    editingItem.value && 'sortCode' in editingItem.value ? (editingItem.value as Account).sortCode : null);
  const initialModalRollRefNumber = computed(() =>
    editingItem.value && 'rollRefNumber' in editingItem.value ? (editingItem.value as Account).rollRefNumber : null);
  const initialModalInterestRate = computed(() =>
    editingItem.value && 'interestRate' in editingItem.value ? (editingItem.value as Account).interestRate : null);
  const initialModalFixedBonusRate = computed(() =>
    editingItem.value && 'fixedBonusRate' in editingItem.value ? (editingItem.value as Account).fixedBonusRate : null);
  const initialModalFixedBonusRateEndDate = computed(() =>
    editingItem.value && 'fixedBonusRateEndDate' in editingItem.value ? (editingItem.value as Account).fixedBonusRateEndDate : null);
  const initialModalReleaseDate = computed(() =>
    editingItem.value && 'releaseDate' in editingItem.value ? (editingItem.value as Account).releaseDate : null);
  const initialModalNumberOfShares = computed(() =>
    editingItem.value && 'numberOfShares' in editingItem.value ? (editingItem.value as Account).numberOfShares : null);
  const initialModalUnderlying = computed(() =>
    editingItem.value && 'underlying' in editingItem.value ? (editingItem.value as Account).underlying : null);
  const initialModalPrice = computed(() =>
    editingItem.value && 'price' in editingItem.value ? (editingItem.value as Account).price : null);
  const initialModalPurchasePrice = computed(() =>
    editingItem.value && 'purchasePrice' in editingItem.value ? (editingItem.value as Account).purchasePrice : null);
  const initialModalPensionMonthlyPayment = computed(() =>
    editingItem.value && 'pensionMonthlyPayment' in editingItem.value ? (editingItem.value as Account).pensionMonthlyPayment : null);
  const initialModalAssetClass = computed(() =>
    editingItem.value && 'assetClass' in editingItem.value ? (editingItem.value as Account).assetClass : null);
  const initialModalParentId = computed(() =>
    editingItem.value && 'parentId' in editingItem.value ? (editingItem.value as Institution).parentId : null);
  const initialModalInstitutionType = computed(() =>
    editingItem.value && 'institutionType' in editingItem.value ? (editingItem.value as Institution).institutionType : null);

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
    initialModalParentId,
    initialModalInstitutionType,
  };
}
