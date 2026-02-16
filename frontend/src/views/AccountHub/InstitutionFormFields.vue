<template>
  <div>
    <div class="form-group">
      <label
        for="institution-name"
        class="form-label"
      >
        Institution Name
      </label>
      <input
        id="institution-name"
        :value="modelValue.name"
        @input="(e) => handleNameChange((e.target as HTMLInputElement).value)"
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
        :value="modelValue.parentId"
        @change="(e) => emit('update:parentId', Number((e.target as HTMLSelectElement).value))"
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
        :value="modelValue.institutionType"
        @change="(e) => emit('update:institutionType', (e.target as HTMLSelectElement).value)"
        id="institutionType"
        class="form-select"
      >
        <option value="">Select Type...</option>
        <option
          v-for="type in institutionTypes"
          :key="type.referenceValue"
          :value="type.referenceValue"
        >
          {{ type.referenceValue }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Institution } from '@/models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';

interface InstitutionForm {
  name: string;
  parentId?: number;
  institutionType?: string | null;
}

defineProps<{
  modelValue: InstitutionForm;
  institutions: Institution[];
  institutionTypes: ReferenceDataItem[];
}>();

const emit = defineEmits<{
  'update:name': [value: string];
  'update:parentId': [value: number];
  'update:institutionType': [value: string];
}>();

const handleNameChange = (value: string): void => {
  emit('update:name', value);
};
</script>
