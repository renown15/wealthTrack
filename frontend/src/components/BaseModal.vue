<template>
  <transition name="modal">
    <div v-if="open" class="modal-overlay" @click.self="close" data-testid="base-modal">
      <div class="modal-content" :class="sizeClass" @click.stop>
        <header class="modal-header">
          <slot name="header">
            <h2>{{ title }}</h2>
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
  </transition>
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

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  z-index: 1000;
}

.modal-content {
  width: min(640px, 90vw);
  max-height: 90vh;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 30px 90px rgba(15, 23, 42, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  outline: none;
}

.modal-content--small {
  width: min(420px, 90vw);
}

.modal-content--large {
  width: min(900px, 95vw);
}

.modal-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.7);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 1.25rem;
  overflow-y: auto;
}

.modal-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid rgba(226, 232, 240, 0.7);
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: #64748b;
  padding: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
