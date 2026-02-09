<template>
  <div v-if="open" class="modal-overlay" @click.self="emitClose">
    <div class="modal-content" @click.stop>
      <header class="modal-header">
        <h2>
          {{ type === 'create' ? 'New' : 'Edit' }}
          {{ resourceType === 'account' ? 'Account' : 'Institution' }}
        </h2>
        <button class="btn-close" @click="emitClose">×</button>
      </header>

      <div class="modal-body">
        <div class="form-group">
          <label :for="`${resourceType}-name`">
            {{ resourceType === 'account' ? 'Account' : 'Institution' }} Name
          </label>
          <input
            :id="`${resourceType}-name`"
            v-model="formData.name"
            type="text"
            :placeholder="
              resourceType === 'account'
                ? 'e.g., Checking, Savings'
                : 'e.g., Chase Bank, Wells Fargo'
            "
          />
        </div>

        <div v-if="resourceType === 'account' && type === 'create'" class="form-group">
          <label for="institution-select">Institution</label>
          <select v-model.number="formData.institutionId" id="institution-select">
            <option value="">Select Institution</option>
            <option v-for="inst in institutions" :key="inst.id" :value="inst.id">
              {{ inst.name }}
            </option>
          </select>
        </div>
      </div>

      <footer class="modal-footer">
        <button class="btn btn-secondary" @click="emitClose">Cancel</button>
        <button class="btn btn-primary" @click="handleSave">
          {{ type === 'create' ? 'Create' : 'Save' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Institution } from '@/models/Portfolio';

interface Props {
  open: boolean;
  type: 'create' | 'edit';
  resourceType: 'account' | 'institution';
  institutions: Institution[];
  initialName?: string;
  initialInstitutionId?: number;
}

interface FormData {
  name: string;
  institutionId: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  save: [name: string, institutionId: number];
}>();

const formData = ref<FormData>({
  name: props.initialName || '',
  institutionId: props.initialInstitutionId || 0,
});

watch(
  () => props.open,
  (newOpen) => {
    if (newOpen) {
      formData.value.name = props.initialName || '';
      formData.value.institutionId = props.initialInstitutionId || 0;
    }
  }
);

const emitClose = (): void => {
  emit('close');
};

const handleSave = (): void => {
  if (!formData.value.name) {
    return;
  }
  if (props.resourceType === 'account' && !formData.value.institutionId) {
    return;
  }
  emit('save', formData.value.name, formData.value.institutionId);
};
</script>

<style scoped src="@/styles/PortfolioView.css"></style>
