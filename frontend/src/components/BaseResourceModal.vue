<template>
  <BaseModal
    :open="open"
    :title="title"
    size="medium"
    @close="emitClose"
  >
    <template #default>
      <slot />
    </template>

    <template #footer>
      <button class="btn-modal-secondary" @click="emitClose">Cancel</button>
      <button class="btn-primary" @click="handleSave">
        {{ saveButtonText }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from '@/components/BaseModal.vue';

interface Props {
  open: boolean;
  title: string;
  saveButtonText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  saveButtonText: 'Save',
});

const emit = defineEmits<{
  close: [];
  save: [];
}>();

const emitClose = (): void => emit('close');
const handleSave = (): void => {
  console.log('[BaseResourceModal] Save button clicked');
  emit('save');
};
</script>
