<template>
  <BaseModal :open="open" :title="title" size="small" @close="emit('close')">
    <template #default>
      <div class="form-group">
        <label class="form-label">{{ label }}</label>
        <input
          :value="modelValue"
          class="form-input"
          :placeholder="placeholder"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          @keyup.enter="emit('submit')"
        />
      </div>
    </template>
    <template #footer>
      <button class="btn-modal-secondary" @click="emit('close')">Cancel</button>
      <button class="btn-primary" :disabled="!modelValue.trim()" @click="emit('submit')">
        {{ submitLabel }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from '@/components/BaseModal.vue';

defineProps<{
  open: boolean;
  title: string;
  label: string;
  modelValue: string;
  submitLabel: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  submit: [];
  close: [];
}>();
</script>
