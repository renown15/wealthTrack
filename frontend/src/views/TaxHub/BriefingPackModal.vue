<template>
  <BaseModal :open="open" title="Tax Briefing Pack" size="small" @close="emit('close')">
    <template #default>
      <p class="text-sm text-muted mb-4">
        Generate a PDF briefing pack reconciling wealth, tax figures, gifts and supporting
        documents for a tax year.
      </p>

      <div class="form-field">
        <label class="form-label">Person</label>
        <select v-model.number="selectedMemberId" class="form-input" @change="loadPeriods">
          <option v-for="person in people" :key="person.id" :value="person.id">
            {{ person.name }}
          </option>
        </select>
      </div>

      <div class="form-field">
        <label class="form-label">Tax year</label>
        <select v-model.number="selectedPeriodId" class="form-input" :disabled="loadingPeriods">
          <option v-for="period in periods" :key="period.id" :value="period.id">
            {{ period.name }}
          </option>
        </select>
        <p v-if="!loadingPeriods && periods.length === 0" class="text-xs text-muted mt-1">
          No tax years found for this person.
        </p>
      </div>
    </template>

    <template #footer>
      <button class="btn-modal-secondary" @click="emit('close')">Cancel</button>
      <button
        class="btn-primary"
        :disabled="selectedPeriodId === null || generating"
        @click="handleGenerate"
      >
        {{ generating ? 'Generating…' : 'Generate PDF' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import BaseModal from '@/components/BaseModal.vue';
import { useTaxBriefing } from '@composables/useTaxBriefing';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const {
  people, periods, selectedMemberId, selectedPeriodId, loadingPeriods, generating,
  loadPeople, loadPeriods, generate,
} = useTaxBriefing();

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) void loadPeople();
  },
);

async function handleGenerate(): Promise<void> {
  const ok = await generate();
  if (ok) emit('close');
}
</script>
