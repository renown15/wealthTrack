<template>
  <AccountModal
    v-if="account"
    :open="open"
    type="edit"
    :institutions="institutions"
    :account-types="accountTypes"
    :account-statuses="accountStatuses"
    :initial-name="initialModalName"
    :initial-institution-id="initialModalInstitutionId"
    :initial-type-id="initialModalTypeId"
    :initial-status-id="initialModalStatusId"
    :initial-opened-at="initialModalOpenedAt"
    :initial-closed-at="initialModalClosedAt"
    :initial-account-number="initialModalAccountNumber"
    :initial-sort-code="initialModalSortCode"
    :initial-roll-ref-number="initialModalRollRefNumber"
    :initial-interest-rate="initialModalInterestRate"
    :initial-fixed-bonus-rate="initialModalFixedBonusRate"
    :initial-fixed-bonus-rate-end-date="initialModalFixedBonusRateEndDate"
    :initial-release-date="initialModalReleaseDate"
    :initial-number-of-shares="initialModalNumberOfShares"
    :initial-underlying="initialModalUnderlying"
    :initial-price="initialModalPrice"
    :initial-purchase-price="initialModalPurchasePrice"
    :initial-pension-monthly-payment="initialModalPensionMonthlyPayment"
    :initial-asset-class="initialModalAssetClass"
    :initial-encumbrance="initialModalEncumbrance"
    :error="error"
    @close="$emit('close')"
    @save="(p) => $emit('save', p)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Account, Institution } from '@/models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import AccountModal from '@views/AccountHub/AccountModal.vue';
import { useModalInitialValues } from '@/composables/useModalInitialValues';
import type { AnalyticsEditSavePayload } from '@/composables/useAnalyticsEdit';

const props = defineProps<{
  account: Account | null;
  open: boolean;
  institutions: Institution[];
  accountTypes: ReferenceDataItem[];
  accountStatuses: ReferenceDataItem[];
  error: string | null;
}>();

defineEmits<{ close: []; save: [AnalyticsEditSavePayload] }>();

const editingItem = computed(() => props.account);
const {
  initialModalName, initialModalInstitutionId, initialModalTypeId, initialModalStatusId,
  initialModalOpenedAt, initialModalClosedAt, initialModalAccountNumber, initialModalSortCode,
  initialModalRollRefNumber, initialModalInterestRate, initialModalFixedBonusRate,
  initialModalFixedBonusRateEndDate, initialModalReleaseDate, initialModalNumberOfShares,
  initialModalUnderlying, initialModalPrice, initialModalPurchasePrice,
  initialModalPensionMonthlyPayment, initialModalAssetClass, initialModalEncumbrance,
} = useModalInitialValues(editingItem);
</script>
