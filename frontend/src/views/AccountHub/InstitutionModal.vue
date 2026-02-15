<template>
  <BaseResourceModal
    :open="open"
    :title="modalTitle"
    :save-button-text="type === 'create' ? 'Create' : 'Save'"
    @close="emitClose"
    @save="handleSave"
  >
    <div v-if="error" class="error-banner mb-4">{{ error }}</div>
    <div class="form-group">
      <label for="institution-name" class="form-label">Institution Name</label>
      <input
        id="institution-name"
        :value="formData.name"
        @input="(e) => formData.name = (e.target as HTMLInputElement).value"
        type="text"
        class="form-input"
        placeholder="e.g., Chase Bank, Wells Fargo"
      />
    </div>

    <div class="form-group">
      <label for="parentInstitution" class="form-label">
        Parent Institution (Optional)
      </label>
      <select
        v-model.number="formData.parentId"
        id="parentInstitution"
        class="form-select"
      >
        <option :value="0">None</option>
        <option
          v-for="inst in institutions"
          :key="inst.id"
          :value="inst.id"
        >
          {{ inst.name }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label for="institutionType" class="form-label">
        Institution Type (Optional)
      </label>
      <select
        v-model="formData.institutionType"
        id="institutionType"
        class="form-select"
      >
        <option :value="null">Select Type...</option>
        <option
          v-for="type in institutionTypes"
          :key="type.referenceValue"
          :value="type.referenceValue"
        >
          {{ type.referenceValue }}
        </option>
      </select>
    </div>
  </BaseResourceModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Institution } from '@/models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import BaseResourceModal from '@/components/BaseResourceModal.vue';

interface InstitutionFormData {
  name: string;
  parentId: number;
  institutionType: string | null;
}

interface Props {
  open: boolean;
  type: 'create' | 'edit';
  institutions: Institution[];
  institutionTypes: ReferenceDataItem[];
  initialName?: string;
  initialParentId?: number | null;
  initialInstitutionType?: string | null;
  error?: string | null;
}

interface SavePayload {
  name: string;
  institutionId: number;
  parentId?: number | null;
  institutionType?: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  save: [SavePayload];
}>();

const formData = ref<InstitutionFormData>({
  name: props.initialName || '',
  parentId: props.initialParentId || 0,
  institutionType: props.initialInstitutionType || null,
});

watch(
  () => props.open,
  (open) => {
    if (open) {
      formData.value.name = props.initialName || '';
      formData.value.parentId = props.initialParentId || 0;
      formData.value.institutionType = props.initialInstitutionType || null;
    }
  }
);

const modalTitle = computed(() => {
  const verb = props.type === 'create' ? 'New' : 'Edit';
  return `${verb} Institution`;
});

const emitClose = (): void => emit('close');

const handleSave = (): void => {
  if (!formData.value.name) return;
  emit('save', {
    name: formData.value.name,
    institutionId: 0,
    parentId: formData.value.parentId || null,
    institutionType: formData.value.institutionType || null,
  });
};
</script>
