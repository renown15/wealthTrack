<template>
  <div
    v-if="message.text"
    class="p-4 mb-4 text-sm font-medium rounded-lg"
    :class="message.type === 'error'
      ? 'bg-red-50 text-red-800 border border-red-200'
      : 'bg-green-50 text-green-800 border border-green-200'
    "
  >
    {{ message.text }}
  </div>
</template>

<script setup lang="ts">
interface Props {
  message: {
    text: string;
    type: 'error' | 'success';
  };
}

defineProps<Props>();
</script>
