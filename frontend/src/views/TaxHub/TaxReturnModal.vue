<template>
  <BaseModal
    :open="open"
    :title="`${account?.accountName ?? ''} — Tax Return`"
    size="small"
    @close="emit('close')"
  >
    <template #default>
      <p class="text-sm text-muted mb-4">
        {{ account?.accountType }}
        <span v-if="account?.institutionName"> · {{ account.institutionName }}</span>
      </p>

      <div class="form-field">
        <label class="form-label">Comment</label>
        <input
          v-model="form.comment"
          class="form-input"
          type="text"
          maxlength="500"
          placeholder="e.g. HSBC Employment"
        />
      </div>

      <div class="form-field">
        <label class="form-label">Income (£)</label>
        <input
          v-model="form.income"
          class="form-input"
          type="text"
          inputmode="decimal"
          min="0"
          placeholder="0.00"
        />
      </div>

      <div class="form-field">
        <label class="form-label">Capital Gain (£)</label>
        <input
          v-model="form.capitalGain"
          class="form-input"
          type="text"
          inputmode="decimal"
          placeholder="0.00"
        />
      </div>

      <div class="form-field">
        <label class="form-label">Tax Taken Off (£)</label>
        <input
          v-model="form.taxTakenOff"
          class="form-input"
          type="text"
          inputmode="decimal"
          min="0"
          placeholder="0.00"
        />
      </div>
    </template>

    <template #footer>
      <button class="btn-modal-secondary" @click="emit('close')">Cancel</button>
      <button class="btn-primary" @click="handleSave">Save</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { EligibleAccount, TaxReturnUpsertRequest } from '@models/TaxModels';
import BaseModal from '@/components/BaseModal.vue';

const props = defineProps<{ open: boolean; account: EligibleAccount | null }>();
const emit = defineEmits<{
  close: [];
  save: [data: TaxReturnUpsertRequest];
}>();

const form = ref({ income: '', capitalGain: '', taxTakenOff: '', comment: '' });

watch(() => props.account, (acct) => {
  if (acct) {
    form.value.income = acct.taxReturn?.income?.toString() ?? '';
    form.value.capitalGain = acct.taxReturn?.capitalGain?.toString() ?? '';
    form.value.taxTakenOff = acct.taxReturn?.taxTakenOff?.toString() ?? '';
    form.value.comment = acct.comment ?? '';
  }
}, { immediate: true });

function parseNum(val: string): number | null {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function handleSave(): void {
  emit('save', {
    income: parseNum(form.value.income),
    capitalGain: parseNum(form.value.capitalGain),
    taxTakenOff: parseNum(form.value.taxTakenOff),
    comment: form.value.comment,
  });
}
</script>
