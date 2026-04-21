<template>
  <BaseModal :open="open" :title="filename" size="large" @close="emit('close')">
    <template #default>
      <div class="flex items-center justify-center" style="height:70vh">
        <img
          v-if="isImage"
          :src="url ?? ''"
          :alt="filename"
          class="max-w-full max-h-full object-contain mx-auto block"
        />
        <iframe
          v-else
          :src="url ?? ''"
          class="w-full border-none"
          style="height:70vh"
          :title="filename"
        />
      </div>
    </template>
    <template #footer>
      <button class="btn-modal-secondary" @click="emit('close')">Close</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseModal from '@/components/BaseModal.vue';

const props = defineProps<{
  open: boolean;
  url: string | null;
  filename: string;
  contentType: string | null;
}>();

const emit = defineEmits<{ close: [] }>();

const isImage = computed(() =>
  !!props.contentType && props.contentType.startsWith('image/'),
);
</script>

