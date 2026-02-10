<template>
  <section v-if="institutions.length > 0" class="institutions-section">
    <h2>Institutions</h2>
    <div class="institutions-list">
      <div v-for="institution in institutions" :key="institution.id" class="institution-item">
        <span class="institution-name">{{ institution.name }}</span>
        <div class="institution-actions">
          <button class="btn-icon edit" @click="emitEdit(institution)" title="Edit">✎</button>
              <button class="btn-icon delete" @click="emitDelete(institution.id, institution.name)" title="Delete">✕</button>
              <button
                class="btn btn-secondary btn-credentials"
                type="button"
                @click="emitManage(institution)"
              >
                Credentials
              </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Institution } from '@/models/Portfolio';

defineProps<{
  institutions: Institution[];
}>();

const emit = defineEmits<{
  editInstitution: [institution: Institution];
  deleteInstitution: [id: number, name: string];
      manageCredentials: [institution: Institution];
}>();

const emitEdit = (institution: Institution): void => {
  emit('editInstitution', institution);
};

const emitDelete = (id: number, name: string): void => {
  emit('deleteInstitution', id, name);
};
    
    const emitManage = (institution: Institution): void => {
      emit('manageCredentials', institution);
    };
</script>

<style scoped src="@/styles/PortfolioView.css"></style>
