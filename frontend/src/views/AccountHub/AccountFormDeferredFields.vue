<template>
  <div>
    <div v-if="fieldConfig.isDeferredType" class="form-group">
      <label for="releaseDate" class="form-label">Release Date</label>
      <input
        id="releaseDate"
        v-model="formData.releaseDate"
        type="date"
        class="form-input"
      />
    </div>

    <div v-if="fieldConfig.showNumberOfShares" class="form-group">
      <label for="numberOfShares" class="form-label">Number of Shares</label>
      <input
        id="numberOfShares"
        v-model="formData.numberOfShares"
        type="text"
        class="form-input"
        placeholder="e.g., 1000"
      />
    </div>

    <div v-if="fieldConfig.showUnderlying" class="form-group">
      <label for="underlying" class="form-label">Underlying</label>
      <input
        id="underlying"
        v-model="formData.underlying"
        type="text"
        class="form-input"
        placeholder="e.g., Stock name or identifier"
      />
    </div>

    <div v-if="fieldConfig.showPrice" class="form-group">
      <label for="price" class="form-label">Price (pence)</label>
      <input
        id="price"
        v-model="formData.price"
        type="text"
        class="form-input"
        placeholder="e.g., 5000 (for £50.00)"
      />
    </div>

    <div v-if="fieldConfig.showPurchasePrice" class="form-group">
      <label for="purchasePrice" class="form-label">Purchase Price (pence)</label>
      <input
        id="purchasePrice"
        v-model="formData.purchasePrice"
        type="text"
        class="form-input"
        placeholder="e.g., 1000 (for £10.00)"
      />
    </div>

    <div v-if="fieldConfig.showPensionMonthlyPayment" class="form-group">
      <label for="pensionMonthlyPayment" class="form-label">Pension Amount</label>
      <input
        id="pensionMonthlyPayment"
        v-model="formData.pensionMonthlyPayment"
        type="text"
        class="form-input"
        placeholder="e.g., 500.00"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormData } from '@views/AccountHub/accountFormFieldsTypes';

interface FieldConfig {
  isDeferredType: boolean;
  showNumberOfShares: boolean;
  showUnderlying: boolean;
  showPrice: boolean;
  showPurchasePrice: boolean;
  showPensionMonthlyPayment: boolean;
}

defineProps<{
  formData: FormData;
  fieldConfig: FieldConfig;
}>();
</script>
