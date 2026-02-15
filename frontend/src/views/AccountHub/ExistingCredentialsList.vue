<template>
  <section class="border border-border rounded-xl p-6 mb-6 bg-gray-50">
    <h3 class="m-0 mb-4 font-semibold text-text-dark">Existing credentials</h3>
    <ul class="list-none p-0 m-0">
      <li
        v-for="credential in credentials"
        :key="credential.id"
        class="flex justify-between items-start py-3 border-b border-border last:border-b-0"
      >
        <div class="flex-1">
          <p class="m-0 font-semibold text-text-dark">{{ credential.typeLabel }}</p>
          <p v-if="credential.key" class="m-0 text-sm text-gray-600">{{ credential.key }}</p>
          <p class="m-0 text-sm text-gray-500">{{ credential.value }}</p>
          <p class="m-0 text-sm text-gray-400">Updated {{ formatDate(credential.updatedAt) }}</p>
          <!-- Character Visualization -->
          <div
            v-if="visualizingId === credential.id"
            class="mt-3"
          >
            <!-- Index row -->
            <div class="flex gap-1 mb-1">
              <div
                v-for="(char, index) in credential.value"
                :key="`${credential.id}-idx-${index}`"
                class="w-8 text-center text-xs text-gray-500 font-bold"
              >
                {{ index + 1 }}
              </div>
            </div>
            <!-- Character boxes row -->
            <div class="flex gap-1">
              <div
                v-for="(char, index) in credential.value"
                :key="`${credential.id}-char-${index}`"
                class="w-8 h-8 border-2 border-blue-400 rounded bg-blue-50 flex items-center justify-center text-sm font-mono text-blue-700"
              >
                {{ char }}
              </div>
            </div>
          </div>
        </div>
        <div class="flex-shrink-0 flex gap-2">
          <button
            class="btn-icon-edit"
            type="button"
            @click="toggleVisualize(credential.id)"
            :class="{ 'opacity-60': visualizingId === credential.id }"
            title="Visualize credential value"
          >{{ Icons.eye }}</button>
          <button
            class="btn-icon-edit"
            type="button"
            @click="$emit('edit', credential)"
            title="Edit credential"
          >{{ Icons.edit }}</button>
          <button
            class="btn-icon-delete"
            type="button"
            @click="$emit('remove', credential.id)"
            :disabled="deletingId === credential.id"
            title="Delete credential"
          >{{ Icons.delete }}</button>
        </div>
      </li>
      <li v-if="!credentials.length" class="py-4 text-muted">
        No credentials stored yet for this institution.
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { InstitutionCredential } from '@/models/InstitutionCredential';
import { Icons } from '@/constants/icons';

defineProps<{
  credentials: InstitutionCredential[];
  deletingId: number | null;
}>();

defineEmits<{
  edit: [InstitutionCredential];
  remove: [number];
}>();

const visualizingId = ref<number | null>(null);

const toggleVisualize = (credentialId: number): void => {
  visualizingId.value = visualizingId.value === credentialId ? null : credentialId;
};

const formatDate = (value: string): string => new Date(value).toLocaleString();
</script>
