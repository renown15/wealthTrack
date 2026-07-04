<template>
  <button
    v-if="selectedPeriodId !== null"
    class="btn-secondary"
    @click="commentaryOpen = true"
  >Commentary</button>
  <button class="btn-secondary" @click="utrOpen = true">
    {{ currentUtr ? `UTR: ${currentUtr}` : 'Set UTR' }}
  </button>

  <TaxPeriodCommentaryModal
    :open="commentaryOpen"
    :period-name="selectedPeriod?.name ?? ''"
    :commentary="selectedPeriod?.commentary ?? ''"
    @close="commentaryOpen = false"
    @save="saveCommentary"
  />
  <SetUtrModal :open="utrOpen" :utr="currentUtr" @close="utrOpen = false" @save="saveUtr" />
</template>

<script setup lang="ts">
import { toRef } from 'vue';
import type { TaxPeriod } from '@models/TaxModels';
import { useTaxHubActions } from '@composables/useTaxHubActions';
import TaxPeriodCommentaryModal from '@views/TaxHub/TaxPeriodCommentaryModal.vue';
import SetUtrModal from '@views/TaxHub/SetUtrModal.vue';

const props = defineProps<{ periods: TaxPeriod[]; selectedPeriodId: number | null }>();

const { commentaryOpen, utrOpen, selectedPeriod, currentUtr, saveCommentary, saveUtr } =
  useTaxHubActions(toRef(props, 'periods'), toRef(props, 'selectedPeriodId'));
</script>
