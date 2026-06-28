<template>
  <AccountModal
    :open="open" :type="type"
    :institutions="institutions" :account-types="accountTypes" :account-statuses="accountStatuses"
    :initial-name="initialModalName" :initial-institution-id="initialModalInstitutionId"
    :initial-type-id="initialModalTypeId" :initial-status-id="initialModalStatusId"
    :initial-opened-at="initialModalOpenedAt" :initial-closed-at="initialModalClosedAt"
    :initial-account-number="initialModalAccountNumber" :initial-sort-code="initialModalSortCode"
    :initial-roll-ref-number="initialModalRollRefNumber" :initial-interest-rate="initialModalInterestRate"
    :initial-fixed-bonus-rate="initialModalFixedBonusRate"
    :initial-fixed-bonus-rate-end-date="initialModalFixedBonusRateEndDate"
    :initial-release-date="initialModalReleaseDate" :initial-number-of-shares="initialModalNumberOfShares"
    :initial-underlying="initialModalUnderlying" :initial-price="initialModalPrice"
    :initial-purchase-price="initialModalPurchasePrice"
    :initial-pension-monthly-payment="initialModalPensionMonthlyPayment"
    :initial-asset-class="initialModalAssetClass" :initial-encumbrance="initialModalEncumbrance"
    :initial-tax-year="initialModalTaxYear" :transfer-accounts="transferAccounts"
    :account-id="item?.id" :error="error"
    @close="emit('close')" @save="(p) => emit('save', p)" @transferred="emit('transferred')"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Account, Institution } from '@/models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import { useModalInitialValues } from '@/composables/useModalInitialValues';
import { type SavePayload } from '@views/AccountHub/accountModalSave';
import AccountModal from '@views/AccountHub/AccountModal.vue';

const props = defineProps<{
  open: boolean;
  type: 'create' | 'edit';
  item: Account | null;
  institutions: Institution[];
  accountTypes: ReferenceDataItem[];
  accountStatuses: ReferenceDataItem[];
  transferAccounts?: { id: number; label: string }[];
  error?: string | null;
}>();

const emit = defineEmits<{ close: []; save: [SavePayload]; transferred: [] }>();

const {
  initialModalName, initialModalInstitutionId, initialModalTypeId, initialModalStatusId,
  initialModalOpenedAt, initialModalClosedAt, initialModalAccountNumber, initialModalSortCode,
  initialModalRollRefNumber, initialModalInterestRate, initialModalFixedBonusRate,
  initialModalFixedBonusRateEndDate, initialModalReleaseDate, initialModalNumberOfShares,
  initialModalUnderlying, initialModalPrice, initialModalPurchasePrice,
  initialModalPensionMonthlyPayment, initialModalAssetClass, initialModalEncumbrance, initialModalTaxYear,
} = useModalInitialValues(computed(() => props.item));
</script>
