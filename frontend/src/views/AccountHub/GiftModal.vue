<template>
  <div v-if="open" class="modal-overlay" @mousedown.self="emit('close')">
    <div class="modal-content modal-content--small" @click.stop>
      <header class="modal-header">
        <h2 class="modal-title">Record Gift</h2>
        <button class="btn-close" type="button" @click="emit('close')">&times;</button>
      </header>

      <div class="modal-body">
        <div class="form-field">
          <label class="form-label">Donor</label>
          <input v-model="form.donor" type="text" class="form-input" placeholder="e.g. Parent, Grandparent" maxlength="255" />
        </div>
        <div class="form-field">
          <label class="form-label">Gift Date</label>
          <input v-model="form.giftDate" type="date" class="form-input" />
        </div>
        <div class="form-field">
          <label class="form-label">Gift Value (£)</label>
          <input v-model="form.giftValueGbp" type="text" inputmode="decimal" class="form-input" placeholder="0.00" />
        </div>
        <div v-if="isShares" class="form-field">
          <label class="form-label">Number of Shares</label>
          <input v-model="form.numShares" type="text" inputmode="decimal" class="form-input" placeholder="0" />
        </div>
      </div>

      <footer class="modal-footer">
        <button class="btn-modal-secondary" type="button" @click="emit('close')">Cancel</button>
        <button class="btn-primary" type="button" :disabled="!isValid" @click="handleSave">Save</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{ open: boolean; accountType?: string }>();

const emit = defineEmits<{
  close: [];
  save: [donor: string, giftDate: string, giftValueGbp: string, numShares: string | null];
}>();

const form = ref({ donor: '', giftDate: new Date().toISOString().slice(0, 10), giftValueGbp: '', numShares: '' });

const isShares = computed(() => props.accountType === 'Shares');

const isValid = computed(() => {
  const hasBase = !!form.value.donor.trim() && !!form.value.giftDate && !!form.value.giftValueGbp && parseFloat(form.value.giftValueGbp) > 0;
  if (!hasBase) return false;
  if (isShares.value) return !!form.value.numShares && parseFloat(form.value.numShares) > 0;
  return true;
});

watch(() => props.open, (open) => {
  if (open) form.value = { donor: '', giftDate: new Date().toISOString().slice(0, 10), giftValueGbp: '', numShares: '' };
});

function handleSave(): void {
  if (!isValid.value) return;
  const numShares = isShares.value && form.value.numShares ? String(form.value.numShares) : null;
  emit('save', form.value.donor.trim(), form.value.giftDate, String(form.value.giftValueGbp), numShares);
  emit('close');
}
</script>
