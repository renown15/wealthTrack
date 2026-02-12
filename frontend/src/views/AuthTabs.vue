<template>
  <div class="flex border-b border-gray-200 bg-gray-50">
    <button
      type="button"
      class="flex-1 py-4 px-4 text-sm font-semibold border-none cursor-pointer transition-all duration-200"
      :class="mode === 'login'
        ? 'bg-white text-blue-600 border-b-2 border-b-blue-600 font-semibold'
        : 'bg-gray-50 text-gray-600 hover:text-gray-900 border-b-2 border-b-transparent'
      "
      @click="emit('update:mode', 'login')"
    >
      Login
    </button>
    <button
      type="button"
      class="flex-1 py-4 px-4 text-sm font-semibold border-none cursor-pointer transition-all duration-200"
      :class="mode === 'register'
        ? 'bg-white text-blue-600 border-b-2 border-b-blue-600 font-semibold'
        : 'bg-gray-50 text-gray-600 hover:text-gray-900 border-b-2 border-b-transparent'
      "
      @click="emit('update:mode', 'register')"
    >
      Register
    </button>
  </div>
</template>

<script setup lang="ts">
type AuthMode = 'login' | 'register';

interface Props {
  mode: AuthMode;
}

const emit = defineEmits<{
  'update:mode': [mode: AuthMode];
}>();

defineProps<Props>();
</script>
