<template>
  <div v-if="open" class="modal-overlay" @mousedown.self="emit('close')">
    <div class="modal-content modal-content--small" @click.stop>
      <header class="modal-header">
        <h2 class="modal-title">Record Dividend</h2>
        <button class="btn-close" type="button" @click="emit('close')">&times;</button>
      </header>

      <div class="modal-body">
        <div class="form-field">
          <label class="form-label">Payment Date</label>
          <input v-model="form.paymentDate" type="date" class="form-input" />
        </div>
        <div class="form-field">
          <label class="form-label">Amount (£)</label>
          <input v-model="form.amount" type="text" inputmode="decimal" class="form-input" placeholder="0.00" />
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

const props = defineProps<{ open: boolean }>();

const emit = defineEmits<{
  close: [];
  save: [amount: string, paymentDate: string];
}>();

const form = ref({ amount: '', paymentDate: new Date().toISOString().slice(0, 10) });

const isValid = computed(() =>
  !!form.value.paymentDate && !!form.value.amount && parseFloat(form.value.amount) > 0
);

watch(() => props.open, (open) => {
  if (open) form.value = { amount: '', paymentDate: new Date().toISOString().slice(0, 10) };
});

function handleSave(): void {
  if (!isValid.value) return;
  emit('save', String(form.value.amount), form.value.paymentDate);
  emit('close');
}
</script>
