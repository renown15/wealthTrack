<template>
  <div>
    <div class="form-field">
      <label class="form-label">
        Upload New Document
        <span class="text-muted">— add several photos to combine into one PDF</span>
      </label>
      <input
        ref="fileInput" type="file" multiple accept="image/*,application/pdf"
        capture="environment" class="form-input" @change="onChange"
      />
    </div>

    <div v-if="items.length > 0" class="flex flex-wrap gap-2 my-3">
      <div v-for="(it, i) in items" :key="it.url" class="relative border border-border rounded p-1 w-20">
        <span class="absolute top-0 left-0 z-10 bg-black/60 text-white text-[10px] leading-none px-1 py-0.5 rounded-br">{{ i + 1 }}</span>
        <button
          v-if="it.isImage" class="absolute top-0 right-0 z-10 bg-black/60 text-white text-[11px] leading-none px-1 py-0.5 rounded-bl border-none cursor-pointer"
          title="Rotate 90°" @click="rotate(i)"
        >{{ Icons.rotate }}</button>
        <div class="w-full h-16 flex items-center justify-center overflow-hidden rounded">
          <img v-if="it.isImage" :src="it.url" class="max-w-full max-h-full object-contain" :style="{ transform: `rotate(${it.rotation}deg)` }" :alt="`Page ${i + 1}`" />
          <span v-else class="text-[10px] text-muted">PDF</span>
        </div>
        <div class="flex justify-between items-center mt-1 text-xs">
          <button class="btn-icon border-none bg-transparent cursor-pointer disabled:opacity-30" :disabled="i === 0" title="Move left" @click="move(i, -1)">{{ Icons.chevronLeft }}</button>
          <button class="btn-icon border-none bg-transparent cursor-pointer text-red-600" title="Remove" @click="removeAt(i)">{{ Icons.delete }}</button>
          <button class="btn-icon border-none bg-transparent cursor-pointer disabled:opacity-30" :disabled="i === items.length - 1" title="Move right" @click="move(i, 1)">{{ Icons.chevronRight }}</button>
        </div>
      </div>
    </div>

    <div class="form-field mt-2">
      <label class="form-label">Description <span class="text-muted">(optional)</span></label>
      <input v-model="description" type="text" class="form-input" placeholder="e.g. Annual statement 2025" maxlength="500" />
    </div>

    <button class="btn-primary mt-2" :disabled="items.length === 0 || building" @click="submit">
      {{ building ? 'Preparing…' : (items.length > 1 ? `Combine ${items.length} into PDF & Upload` : `${Icons.upload} Upload`) }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Icons } from '@/constants/icons';
import { useDocumentUpload } from '@/composables/useDocumentUpload';

const emit = defineEmits<{ upload: [file: File, description?: string] }>();

const { items, addFiles, removeAt, move, rotate, reset, buildDocument } = useDocumentUpload();
const fileInput = ref<HTMLInputElement | null>(null);
const description = ref('');
const building = ref(false);

function onChange(event: Event): void {
  addFiles((event.target as HTMLInputElement).files);
  if (fileInput.value) fileInput.value.value = '';
}

async function submit(): Promise<void> {
  if (items.value.length === 0 || building.value) return;
  building.value = true;
  try {
    const file = await buildDocument(description.value);
    if (file) emit('upload', file, description.value || undefined);
    reset();
    description.value = '';
  } finally {
    building.value = false;
  }
}
</script>
