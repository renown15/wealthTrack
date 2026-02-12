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
        </div>
        <div class="flex-shrink-0 flex gap-2">
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

const formatDate = (value: string): string => new Date(value).toLocaleString();
</script>
