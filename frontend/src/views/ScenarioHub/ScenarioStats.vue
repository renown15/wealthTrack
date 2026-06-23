<template>
  <header class="header-panel">
    <div class="header-top">
      <div>
        <h2 class="header-title">Scenarios</h2>
        <p class="header-subtitle">Plan account risk allocation across configurable groups.</p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="emit('create')">+ New Scenario</button>
      </div>
    </div>

    <div v-if="scenarios.length > 0" class="stats-grid">
      <article
        v-for="s in scenarios"
        :key="s.scenarioId"
        class="stat-card cursor-pointer"
        :class="{ 'ring-2 ring-white': s.scenarioId === selectedId }"
        @click="emit('select', s.scenarioId)"
      >
        <p class="m-0 text-sm font-semibold text-white leading-snug truncate">{{ s.name }}</p>
        <div class="flex items-center justify-between mt-2">
          <p class="m-0 text-xs text-white/70">{{ s.groupCount }} group{{ s.groupCount !== 1 ? 's' : '' }}</p>
          <span v-if="!s.isOwner" class="text-white/50 text-xs">{{ Icons.eye }}</span>
          <div v-if="s.isOwner" class="flex gap-2">
            <button
              class="text-white/60 hover:text-white bg-transparent border-none cursor-pointer p-0 text-sm leading-none"
              title="Rename"
              @click.stop="emit('rename', s)"
            >{{ Icons.edit }}</button>
            <button
              class="text-white/60 hover:text-white bg-transparent border-none cursor-pointer p-0 text-sm leading-none"
              title="Delete"
              @click.stop="emit('delete', s)"
            >{{ Icons.delete }}</button>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="mt-4 text-white/80 text-sm">
      No scenarios yet. Click <strong>+ New Scenario</strong> to get started.
    </div>
  </header>
</template>

<script setup lang="ts">
import type { ScenarioListItem } from '@models/scenario';
import { Icons } from '@/constants/icons';

defineProps<{
  scenarios: ScenarioListItem[];
  selectedId: number | null;
}>();

const emit = defineEmits<{
  create: [];
  select: [id: number];
  rename: [scenario: ScenarioListItem];
  delete: [scenario: ScenarioListItem];
}>();
</script>
