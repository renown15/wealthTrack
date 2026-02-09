<template>
  <div v-if="open" class="modal-overlay" @click.self="emitClose">
    <div class="modal-content" @click.stop>
      <header class="modal-header">
        <h2>Confirm Delete</h2>
        <button class="btn-close" @click="emitClose">×</button>
      </header>

      <div class="modal-body">
        <p>
          Are you sure you want to delete <strong>{{ itemName }}</strong>? This action cannot be
          undone.
        </p>
      </div>

      <footer class="modal-footer">
        <button class="btn btn-secondary" @click="emitClose">Cancel</button>
        <button class="btn btn-danger" @click="emitConfirm">Delete</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean;
  itemName: string;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();

const emitClose = (): void => {
  emit('close');
};

const emitConfirm = (): void => {
  emit('confirm');
};
</script>

<style scoped src="@/styles/PortfolioView.css"></style>
