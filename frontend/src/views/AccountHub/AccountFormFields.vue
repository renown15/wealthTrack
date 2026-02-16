<template>
  <div>
    <div class="form-group">
      <label for="accountName" class="form-label">Account Name</label>
      <input
        id="accountName"
        :value="formData.name"
        @input="(e) => formData.name = (e.target as HTMLInputElement).value"
        type="text"
        class="form-input"
        placeholder="e.g., Checking, Savings"
      />
    </div>

    <div class="form-group">
      <label for="accountType" class="form-label">Account Type</label>
      <select
        id="accountType"
        v-model.number="formData.typeId"
        class="form-select"
      >
        <option value="">Select Account Type</option>
        <option v-for="t in accountTypes" :key="t.id" :value="t.id">
          {{ t.referenceValue }}
        </option>
      </select>
    </div>

    <div v-if="type === 'create'" class="form-group">
      <label for="institution-select" class="form-label">Institution</label>
      <select
        v-model.number="formData.institutionId"
        id="institution-select"
        class="form-select"
      >
        <option value="">Select Institution</option>
        <option v-for="inst in institutions" :key="inst.id" :value="inst.id">
          {{ inst.name }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label for="accountStatus" class="form-label">Account Status</label>
      <select id="accountStatus" v-model.number="formData.statusId" class="form-select">
        <option value="">Select Account Status</option>
        <option v-for="status in accountStatuses" :key="status.id" :value="status.id">
          {{ status.referenceValue }}
        </option>
      </select>
    </div>

    <div v-if="!getFieldConfig.isDeferredType" class="grid grid-cols-2 gap-4">
      <div class="form-group">
        <label for="openedAt" class="form-label">Opened Date</label>
        <input id="openedAt" v-model="formData.openedAt" type="date" class="form-input" />
      </div>
      <div class="form-group">
        <label for="closedAt" class="form-label">Closed Date</label>
        <input id="closedAt" v-model="formData.closedAt" type="date" class="form-input" />
      </div>
    </div>

    <div v-if="!getFieldConfig.isDeferredType" class="form-group">
      <label for="accountNumber" class="form-label">Account Number</label>
      <input
        id="accountNumber"
        v-model="formData.accountNumber"
        type="text"
        class="form-input"
        placeholder="e.g., 12345678"
      />
    </div>

    <div v-if="!getFieldConfig.isDeferredType" class="grid grid-cols-2 gap-4">
      <div class="form-group">
        <label for="sortCode" class="form-label">Sort Code</label>
        <input
          id="sortCode"
          v-model="formData.sortCode"
          type="text"
          class="form-input"
          placeholder="e.g., 12-34-56"
        />
      </div>
      <div class="form-group">
        <label for="rollRefNumber" class="form-label">Roll / Ref Number</label>
        <input
          id="rollRefNumber"
          v-model="formData.rollRefNumber"
          type="text"
          class="form-input"
          placeholder="e.g., 123456789"
        />
      </div>
    </div>

    <div v-if="getFieldConfig.showInterestRate && !getFieldConfig.isDeferredType" class="form-group">
      <label for="interestRate" class="form-label">Interest Rate</label>
      <input
        id="interestRate"
        v-model="formData.interestRate"
        type="text"
        class="form-input"
        placeholder="e.g., 2.5%"
      />
    </div>

    <div v-if="getFieldConfig.showFixedBonusRate" class="form-group">
      <label for="fixedBonusRate" class="form-label">Fixed / Bonus Interest Rate</label>
      <input
        id="fixedBonusRate"
        v-model="formData.fixedBonusRate"
        type="text"
        class="form-input"
        placeholder="e.g., 4.5%"
      />
    </div>
    <div v-if="getFieldConfig.showFixedBonusRateEndDate" class="form-group">
      <label for="fixedBonusRateEndDate" class="form-label">Fixed Rate End</label>
      <input
        id="fixedBonusRateEndDate"
        v-model="formData.fixedBonusRateEndDate"
        type="date"
        class="form-input"
      />
    </div>

    <div v-if="getFieldConfig.isDeferredType" class="form-group">
      <label for="releaseDate" class="form-label">Release Date</label>
      <input
        id="releaseDate"
        v-model="formData.releaseDate"
        type="date"
        class="form-input"
      />
    </div>

    <div v-if="getFieldConfig.showNumberOfShares" class="form-group">
      <label for="numberOfShares" class="form-label">Number of Shares</label>
      <input
        id="numberOfShares"
        v-model="formData.numberOfShares"
        type="text"
        class="form-input"
        placeholder="e.g., 1000"
      />
    </div>

    <div v-if="getFieldConfig.showUnderlying" class="form-group">
      <label for="underlying" class="form-label">Underlying</label>
      <input
        id="underlying"
        v-model="formData.underlying"
        type="text"
        class="form-input"
        placeholder="e.g., Stock name or identifier"
      />
    </div>

    <div v-if="getFieldConfig.showPrice" class="form-group">
      <label for="price" class="form-label">Price (pence)</label>
      <input
        id="price"
        v-model="formData.price"
        type="text"
        class="form-input"
        placeholder="e.g., 5000 (for £50.00)"
      />
    </div>

    <div v-if="getFieldConfig.showPurchasePrice" class="form-group">
      <label for="purchasePrice" class="form-label">Purchase Price (pence)</label>
      <input
        id="purchasePrice"
        v-model="formData.purchasePrice"
        type="text"
        class="form-input"
        placeholder="e.g., 1000 (for £10.00)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ACCOUNT_TYPE_FIELD_CONFIG } from '@views/AccountHub/accountTypeFieldConfig';
import { type AccountFormFieldsProps } from '@views/AccountHub/accountFormFieldsTypes';

const props = defineProps<AccountFormFieldsProps>();

const getFieldConfig = computed(() => {
  if (!props.formData.typeId) return ACCOUNT_TYPE_FIELD_CONFIG['DEFAULT'];
  const selectedType = props.accountTypes.find(
    (t) => t.id === props.formData.typeId
  );
  const typeName = selectedType?.referenceValue;
  return ACCOUNT_TYPE_FIELD_CONFIG[typeName || 'DEFAULT'] || ACCOUNT_TYPE_FIELD_CONFIG['DEFAULT'];
});
</script>