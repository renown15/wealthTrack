<template>
  <div>
    <div v-if="fieldConfig.isDeferredType" class="form-group">
      <label for="releaseDate" class="form-label">Release Date</label>
      <input id="releaseDate" v-model="formData.releaseDate" type="date" class="form-input" />
    </div>

    <div v-if="fieldConfig.showNumberOfShares && fieldConfig.showUnderlying" class="grid grid-cols-2 gap-4">
      <div class="form-group">
        <label for="numberOfShares" class="form-label">Number of Shares</label>
        <input id="numberOfShares" v-model="formData.numberOfShares" type="number" min="1" step="1" class="form-input" placeholder="e.g., 1000" />
      </div>
      <div class="form-group">
        <label for="underlying" class="form-label">Underlying</label>
        <input id="underlying" v-model="formData.underlying" type="text" class="form-input" placeholder="e.g., AAPL" />
      </div>
    </div>

    <div v-if="fieldConfig.showNumberOfShares && !fieldConfig.showUnderlying" class="form-group">
      <label for="numberOfShares" class="form-label">Number of Shares</label>
      <input id="numberOfShares" v-model="formData.numberOfShares" type="number" min="1" step="1" class="form-input" placeholder="e.g., 1000" />
    </div>

    <div v-if="fieldConfig.showPrice && fieldConfig.showPurchasePrice" class="grid grid-cols-2 gap-4">
      <div class="form-group">
        <label for="price" class="form-label">Price (pence)</label>
        <input id="price" v-model="formData.price" type="number" min="1" step="1" class="form-input" placeholder="e.g., 5000" />
      </div>
      <div class="form-group">
        <label for="purchasePrice" class="form-label">Purchase Price (pence)</label>
        <input id="purchasePrice" v-model="formData.purchasePrice" type="number" min="1" step="1" class="form-input" placeholder="e.g., 1000" />
      </div>
    </div>

    <div v-if="fieldConfig.showPrice && !fieldConfig.showPurchasePrice" class="form-group">
      <label for="price" class="form-label">Price (pence)</label>
      <input id="price" v-model="formData.price" type="number" min="1" step="1" class="form-input" placeholder="e.g., 5000" />
    </div>

    <div v-if="fieldConfig.showPensionMonthlyPayment" class="form-group">
      <label for="pensionMonthlyPayment" class="form-label">Pension Amount</label>
      <input id="pensionMonthlyPayment" v-model="formData.pensionMonthlyPayment" type="number" min="0" step="0.01" class="form-input" placeholder="e.g., 500.00" />
    </div>

    <div v-if="fieldConfig.showEncumbrance" class="mt-2">
      <div
        class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-border cursor-pointer"
        @click="onToggleEncumbrance"
      >
        <div>
          <span class="text-sm font-medium text-text-dark">Encumbrance</span>
          <p class="text-xs text-muted mt-0.5 mb-0">A charge secured against this account</p>
        </div>
        <div
          class="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
          :class="encumbranceEnabled ? 'bg-primary' : 'bg-gray-300'"
        >
          <div
            class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
            :class="encumbranceEnabled ? 'translate-x-5' : 'translate-x-0'"
          ></div>
        </div>
      </div>
      <div v-if="encumbranceEnabled" class="form-group mt-3">
        <label for="encumbrance" class="form-label">Encumbrance Amount (£)</label>
        <input id="encumbrance" v-model="formData.encumbrance" type="number" min="0" step="0.01" class="form-input" placeholder="e.g., 5000.00" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { FormData } from '@views/AccountHub/accountFormFieldsTypes';
import { debug } from '@utils/debug';

interface FieldConfig {
  isDeferredType: boolean;
  showNumberOfShares: boolean;
  showUnderlying: boolean;
  showPrice: boolean;
  showPurchasePrice: boolean;
  showPensionMonthlyPayment: boolean;
  showEncumbrance: boolean;
}

const props = defineProps<{
  formData: FormData;
  fieldConfig: FieldConfig;
}>();

const encumbranceEnabled = ref(!!props.formData.encumbrance);

watch(() => props.formData.encumbrance, (val) => {
  encumbranceEnabled.value = !!val;
}, { immediate: true });

function onToggleEncumbrance(): void {
  encumbranceEnabled.value = !encumbranceEnabled.value;
  if (!encumbranceEnabled.value) {
    props.formData.encumbrance = '';
  }
}
</script>
