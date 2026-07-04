<template>
  <BaseModal
    :open="open"
    :dismissable="false"
    :title="`Commentary — ${periodName}`"
    size="large"
    @close="emit('close')"
  >
    <p class="text-sm text-muted mb-3">
      Tell the story of this tax year — context, events and anything the accountant should know.
    </p>
    <RichTextEditor v-model="draft" />

    <template #footer>
      <button class="btn-modal-secondary" @click="emit('close')">Cancel</button>
      <button class="btn-primary" @click="emit('save', draft)">Save</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import BaseModal from '@/components/BaseModal.vue';
import RichTextEditor from '@/components/RichTextEditor.vue';

const props = defineProps<{ open: boolean; periodName: string; commentary: string }>();
const emit = defineEmits<{ close: []; save: [html: string] }>();

const draft = ref('');
watch(() => props.open, (isOpen) => {
  if (isOpen) draft.value = props.commentary || '';
}, { immediate: true });
</script>
