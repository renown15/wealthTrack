<template>
  <div>
    <div class="grid grid-cols-3 gap-4">
      <div class="form-group" :class="getFieldConfig.showAssetClass ? 'col-span-2' : 'col-span-3'">
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
      <div v-if="getFieldConfig.showAssetClass" class="form-group">
        <label for="assetClass" class="form-label">Asset Class</label>
        <select id="assetClass" v-model="formData.assetClass" class="form-select">
          <option value="">—</option>
          <option v-for="item in assetClassOptions" :key="item.id" :value="item.referenceValue">{{ item.referenceValue }}</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="form-group">
        <label for="accountType" class="form-label">Account Type</label>
        <select id="accountType" v-model.number="formData.typeId" class="form-select">
          <option value="">Select type</option>
          <option v-for="t in accountTypes" :key="t.id" :value="t.id">{{ t.referenceValue }}</option>
        </select>
      </div>
      <div class="form-group">
        <label for="accountStatus" class="form-label">Account Status</label>
        <select id="accountStatus" v-model.number="formData.statusId" class="form-select">
          <option value="">Select status</option>
          <option v-for="s in accountStatuses" :key="s.id" :value="s.id">{{ s.referenceValue }}</option>
        </select>
      </div>
    </div>

    <div v-if="type === 'create'" class="form-group">
      <label for="institution-select" class="form-label">Institution</label>
      <select v-model.number="formData.institutionId" id="institution-select" class="form-select">
        <option value="">Select Institution</option>
        <option v-for="inst in institutions" :key="inst.id" :value="inst.id">{{ inst.name }}</option>
      </select>
    </div>

    <div v-if="!getFieldConfig.isDeferredType" :class="isClosedStatus ? 'grid grid-cols-2 gap-4' : ''">
      <div class="form-group">
        <label for="openedAt" class="form-label">Opened Date</label>
        <input id="openedAt" v-model="formData.openedAt" type="date" class="form-input" />
      </div>
      <div v-if="isClosedStatus" class="form-group">
        <label for="closedAt" class="form-label">Closed Date</label>
        <input id="closedAt" v-model="formData.closedAt" type="date" class="form-input" />
      </div>
    </div>

    <div v-if="getFieldConfig.showBankingDetails" class="form-group">
      <label for="accountNumber" class="form-label">Account Number</label>
      <input id="accountNumber" v-model="formData.accountNumber" type="text" class="form-input" placeholder="e.g., 12345678" />
    </div>

    <div v-if="getFieldConfig.showBankingDetails" class="grid grid-cols-2 gap-4">
      <div class="form-group">
        <label for="sortCode" class="form-label">Sort Code</label>
        <input
          id="sortCode"
          :value="formData.sortCode"
          @input="onSortCodeInput"
          type="text"
          class="form-input"
          :class="sortCodeError ? 'border-red-400' : ''"
          placeholder="e.g., 12-34-56"
          maxlength="8"
        />
        <p v-if="sortCodeError" class="text-xs text-red-500 mt-1">{{ sortCodeError }}</p>
      </div>
      <div class="form-group">
        <label for="rollRefNumber" class="form-label">Roll / Ref Number</label>
        <input id="rollRefNumber" v-model="formData.rollRefNumber" type="text" class="form-input" placeholder="e.g., 123456789" />
      </div>
    </div>

    <div v-if="getFieldConfig.showInterestRate && !getFieldConfig.showFixedBonusRate" class="form-group">
      <label for="interestRate" class="form-label">Interest Rate (%)</label>
      <input id="interestRate" v-model="formData.interestRate" type="number" min="0" max="100" step="0.01" class="form-input" placeholder="e.g., 2.5" />
    </div>

    <div v-if="getFieldConfig.showInterestRate && getFieldConfig.showFixedBonusRate" class="grid grid-cols-2 gap-4">
      <div class="form-group">
        <label for="interestRate" class="form-label">Interest Rate (%)</label>
        <input id="interestRate" v-model="formData.interestRate" type="number" min="0" max="100" step="0.01" class="form-input" placeholder="e.g., 2.5" />
      </div>
      <div class="form-group">
        <label for="fixedBonusRate" class="form-label">Fixed / Bonus Rate (%)</label>
        <input id="fixedBonusRate" v-model="formData.fixedBonusRate" type="number" min="0" max="100" step="0.01" class="form-input" placeholder="e.g., 4.5" />
      </div>
    </div>

    <div v-if="getFieldConfig.showFixedBonusRateEndDate" class="form-group">
      <label for="fixedBonusRateEndDate" class="form-label">Fixed Rate End</label>
      <input id="fixedBonusRateEndDate" v-model="formData.fixedBonusRateEndDate" type="date" class="form-input" />
    </div>

    <AccountFormDeferredFields :form-data="formData" :field-config="getFieldConfig" />
  </div>
</template>
<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { ACCOUNT_TYPE_FIELD_CONFIG } from '@views/AccountHub/accountTypeFieldConfig';
import { type AccountFormFieldsProps } from '@views/AccountHub/accountFormFieldsTypes';
import { referenceDataService } from '@/services/ReferenceDataService';
import { debug } from '@utils/debug';
import { SORT_CODE_REGEX } from '@/constants/attributeTypes';
import AccountFormDeferredFields from '@views/AccountHub/AccountFormDeferredFields.vue';

const props = defineProps<AccountFormFieldsProps>();

const assetClassOptions = ref<Array<{ id: number; referenceValue: string }>>([]);
const sortCodeError = ref<string | null>(null);

function onSortCodeInput(e: Event): void {
  const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
  const fmt = digits.length > 4 ? `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`
    : digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits;
  props.formData.sortCode = fmt;
  sortCodeError.value = fmt && !SORT_CODE_REGEX.test(fmt) ? 'Sort code must be in XX-YY-ZZ format' : null;
}

const getFieldConfig = computed(() => {
  const typeName = props.accountTypes.find((t) => t.id === props.formData.typeId)?.referenceValue;
  return ACCOUNT_TYPE_FIELD_CONFIG[typeName || 'DEFAULT'] || ACCOUNT_TYPE_FIELD_CONFIG['DEFAULT'];
});

const isClosedStatus = computed(() => {
  const status = props.accountStatuses.find(s => s.id === props.formData.statusId);
  return status?.referenceValue === 'Closed';
});

onMounted(async () => {
  try {
    assetClassOptions.value = await referenceDataService.listByClass('asset_class');
  } catch (error) {
    debug.error('[AccountFormFields] Error loading asset class options', error);
  }
});
</script>
