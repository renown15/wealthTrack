<template>
  <div v-if="open" class="modal-overlay" @mousedown.self="close" data-testid="base-modal">
    <div class="modal-content" :class="sizeClass" @click.stop>
      <header class="modal-header">
        <slot name="header">
          <h2 class="modal-title">{{ title }}</h2>
        </slot>
        <button class="btn-close" type="button" @click="close">×</button>
      </header>

      <section class="modal-body">
        <slot />
      </section>

      <footer class="modal-footer">
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  open: boolean;
  title?: string;
  size?: 'small' | 'medium' | 'large';
}>();

const emit = defineEmits<{
  close: [];
}>();

const sizeClass = computed(() => {
  switch (props.size) {
    case 'small':
      return 'modal-content--small';
    case 'large':
      return 'modal-content--large';
    default:
      return 'modal-content--medium';
  }
});

const close = (): void => {
  emit('close');
};
</script>

<!-- Uses UnoCSS utilities via shortcuts -->
