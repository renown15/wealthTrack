<template>
  <div>
    <div v-if="fieldConfig.showRenewalType" class="grid grid-cols-2 gap-4">
      <div class="form-group">
        <label for="renewalType" class="form-label">Renewal Type</label>
        <select id="renewalType" v-model="formData.renewalType" class="form-select">
          <option value="">— select —</option>
          <option v-for="rt in renewalTypeOptions" :key="rt.id" :value="rt.referenceValue">{{ rt.referenceValue }}</option>
        </select>
      </div>
      <div v-if="fieldConfig.showMonthlyCost" class="form-group">
        <label for="monthlyCost" class="form-label">Cost (£)</label>
        <input id="monthlyCost" v-model="formData.monthlyCost" type="text" inputmode="decimal" class="form-input" placeholder="e.g., 45.99" />
      </div>
    </div>
    <div v-if="fieldConfig.showCostingMethod" class="grid grid-cols-2 gap-4">
      <div class="form-group">
        <label for="costingMethod" class="form-label">Costing Method</label>
        <select id="costingMethod" v-model="formData.costingMethod" class="form-select">
          <option value="">Fixed (default)</option>
          <option v-for="cm in costingMethodOptions" :key="cm.id" :value="cm.referenceValue">{{ cm.referenceValue }}</option>
        </select>
      </div>
      <div v-if="fieldConfig.showOutgoingEndDate" class="form-group">
        <label for="outgoingEndDate" class="form-label">End Date <span class="text-xs text-muted">(if it ends)</span></label>
        <input id="outgoingEndDate" v-model="formData.outgoingEndDate" type="date" class="form-input" />
      </div>
    </div>
    <div v-if="fieldConfig.showRenewalDate" class="form-group">
      <label for="renewalDate" class="form-label">Renewal Date <span class="text-xs text-muted">(leave blank for rolling)</span></label>
      <input id="renewalDate" v-model="formData.renewalDate" type="date" class="form-input" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { FormData } from '@views/AccountHub/accountFormFieldsTypes';
import { referenceDataService } from '@/services/ReferenceDataService';
import { debug } from '@utils/debug';

interface FieldConfig {
  showRenewalType: boolean;
  showRenewalDate: boolean;
  showMonthlyCost: boolean;
  showCostingMethod: boolean;
  showOutgoingEndDate: boolean;
}

defineProps<{ formData: FormData; fieldConfig: FieldConfig }>();

const renewalTypeOptions = ref<Array<{ id: number; referenceValue: string }>>([]);
const costingMethodOptions = ref<Array<{ id: number; referenceValue: string }>>([]);

onMounted(async () => {
  try {
    renewalTypeOptions.value = await referenceDataService.listByClass('renewal_type');
    costingMethodOptions.value = await referenceDataService.listByClass('costing_method');
  } catch (error) {
    debug.error('[AccountFormOutgoingFields] Error loading outgoing field options', error);
  }
});
</script>
